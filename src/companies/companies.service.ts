import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { PrismaError } from '../database/prisma-error.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyNotFoundException } from './company-not-found.exception';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { EmailNotUniqueException } from '../employees/email-not-unique.exception';
import * as bcrypt from 'bcrypt';
import { EmployeeRole } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {
  }

  async registerCompany(companyRegistrationWithOwnerDto: RegisterCompanyDto) {
    try {
      const hashedPassword = await bcrypt.hash(companyRegistrationWithOwnerDto.password, 10);
      return await this.prismaService.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: companyRegistrationWithOwnerDto.companyName,
          }
        });

        const owner = await tx.employee.create({
          data: {
            email: companyRegistrationWithOwnerDto.email,
            passwordHash: hashedPassword,
            name: companyRegistrationWithOwnerDto.ownerName,
            position: EmployeeRole.OWNER,
            companyId: company.id,
          },
        });

        return {
          company,
          owner,
        };
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        const target = (error.meta?.target ?? []) as string[];
        if (target.includes('email')) {
          throw new EmailNotUniqueException();
        }
      }
      throw error;
    }
  }

  async getAll() {
    return this.prismaService.company.findMany();
  }

  async getById(id: number) {
    const company = await this.prismaService.company.findUnique({
      where: {
        id,
      },
    });
    if (!company) {
      throw new CompanyNotFoundException(id);
    }
    return company;
  }

  async update(id: number, company: UpdateCompanyDto) {
    try {
      return await this.prismaService.company.update({
        data: {
          ...company,
          id: undefined
      },
        where: {
          id,
        }
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException();
      }

      throw error;
    }
  }

  async delete(id: number) {
    try {
      return await this.prismaService.company.delete({
        where: {
          id,
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException()
      }
      throw error;
    }
  }
}