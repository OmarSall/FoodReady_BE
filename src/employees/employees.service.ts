import { PrismaService } from '../database/prisma.service';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {
  }
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
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          throw new CompanyNotFoundException(companyId);
        }

        const inviteToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

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
  }

  async findAllForCompany(companyId: number) {
    return this.prismaService.employee.findMany({
      where: {companyId},
      select: this.safeEmployeeSelect,
    });
  }

  async findById(id: number) {
    const employee = await this.prismaService.employee.findUnique({
      where: {
        id,
      },
      select: this.safeEmployeeSelect,
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

  async findByCompany(companyId: number) {
    return this.prismaService.employee.findMany({
      where: {
        companyId: companyId,
      },
      select: this.safeEmployeeSelect,
    })
  }

  async update(id: number, employee: UpdateEmployeeDto) {
    try {
      return await this.prismaService.employee.update({
        where: {
          id,
        },
        data: employee,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new EmployeeNotFoundException(id);
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new EmailNotUniqueException();
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      return await this.prismaService.employee.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new EmployeeNotFoundException(id);
      }
      throw error;
    }
  }
}