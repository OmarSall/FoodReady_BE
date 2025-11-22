import { PrismaService } from '../database/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaError } from '../database/prisma-error.enum';
import { EmailNotUniqueException } from './email-not-unique.exception';
import { EmployeeNotFoundException } from './employee-not-found.exception';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CompanyNotFoundException } from '../companies/company-not-found.exception';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prismaService: PrismaService) {
  }

  async createForCompany(companyId: number, employeeDto: CreateEmployeeDto) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(employeeDto.password, 10);
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
            passwordHash: hashedPassword,
            position: employeeDto.position,
            companyId: companyId,
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

  async findAll() {
    return this.prismaService.employee.findMany({
      include: {
        company: true,
      },
    });
  }

  async findById(id: number) {
    const employee = await this.prismaService.employee.findUnique({
      where: {
        id,
      },
      include: {
        company: true,
      },
    });
    if (!employee) {
      throw new EmployeeNotFoundException(id);
    }
    return employee;
  }

  async findByCompany(companyId: number) {
    return this.prismaService.employee.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        company: true,
      }
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
    }
  }
}