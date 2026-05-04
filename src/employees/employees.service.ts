import { PrismaService } from '../database/prisma.service';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaError } from '../database/prisma-error.enum';
import { EmailNotUniqueException } from './email-not-unique.exception';
import { EmployeeNotFoundException } from './employee-not-found.exception';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CompanyNotFoundException } from '../companies/company-not-found.exception';
import { EmployeeEmailNotFoundException } from './employeeEmail-not-found.exception';
import { EmployeeRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {
  }

  // Fields that are safe to expose via API responses.
  // This prevents leaking sensitive data such as passwordHash or
  // invite tokens.
  private readonly safeEmployeeSelect = {
    id: true,
    name: true,
    email: true,
    position: true,
    companyId: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async createForCompany(companyId: number, employeeDto: CreateEmployeeDto) {
    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    let employee: {
      id: number;
      name: string;
      email: string;
      position: EmployeeRole;
      companyId: number;
    };

    try {
      employee = await this.prismaService.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          throw new CompanyNotFoundException(companyId);
        }

        return tx.employee.create({
          data: {
            name: employeeDto.name,
            email: employeeDto.email,
            position: employeeDto.position as EmployeeRole,
            companyId: companyId,
            inviteToken: inviteToken,
            inviteTokenExpires: expiresAt,
          },
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            companyId: true,
          },
        });
      });

    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new EmailNotUniqueException();
      }
      throw error;
    }
    try {
      await this.sendInvitationEmail(
        employeeDto.email,
        employeeDto.name,
        inviteToken,
      );
    } catch (mailError) {
      this.logger.error(
        `Failed to send invitation email for employee ${employee.id}`,
        mailError,
      );
      await this.prismaService.employee.delete({
        where: { id: employee.id },
      });
      throw new InternalServerErrorException(
        'Failed to send invitation email. Please try again later.',
      );
    }
    return employee;
  }

  async findAllForCompany(companyId: number) {
    return this.prismaService.employee.findMany({
      where: { companyId },
      select: this.safeEmployeeSelect,
    });
  }

  async findByIdForCompany(companyId: number, employeeId: number) {
    const employee = await this.prismaService.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
      select: this.safeEmployeeSelect,
    });
    if (!employee) {
      throw new EmployeeNotFoundException(employeeId);
    }
    return employee;
  }

  // auth-only method - used by JwtStrategy
  async findById(id: number) {
    const employee = await this.prismaService.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new EmployeeNotFoundException(id);
    }

    return employee;
  }

  async findByEmail(email: string) {
    const employee = await this.prismaService.employee.findUnique({
      where: {
        email,
      },
    });
    if (!employee) {
      throw new EmployeeEmailNotFoundException(email);
    }
    return employee;
  }

  private async updateEmployeeScoped(
    companyId: number,
    employeeId: number,
    employee: UpdateEmployeeDto,
  ) {
    try {
      return await this.prismaService.employee.updateMany({
        where: {
          id: employeeId,
          companyId,
        },
        data: employee,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new EmailNotUniqueException();
      }
      throw error;
    }
  }

  async updateForCompany(
    companyId: number,
    employeeId: number,
    employee: UpdateEmployeeDto,
  ) {
    const updateManyResult = await this.updateEmployeeScoped(
      companyId,
      employeeId,
      employee,
    );

    if (updateManyResult.count === 0) {
      throw new EmployeeNotFoundException(employeeId);
    }

    return this.findByIdForCompany(companyId, employeeId);
  }

  async deleteForCompany(companyId: number, employeeId: number) {
    const deleteManyResult = await this.prismaService.employee.deleteMany({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (deleteManyResult.count === 0) {
      throw new EmployeeNotFoundException(employeeId);
    }
    return { deleted: true };
  }

  private async sendInvitationEmail(
    email: string,
    name: string,
    inviteToken: string,
  ): Promise<void> {
    await this.mailService
      .sendInvitation({
        to: email,
        employeeName: name,
        inviteToken: inviteToken,
      });
  }
}
