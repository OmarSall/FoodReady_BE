import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SlugNotUniqueException } from './slug-not-unique.exception';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyNotFoundException } from './company-not-found.exception';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {
  }

  async create(company: CreateCompanyDto) {
    try {
      return await this.prismaService.company.create({
        data: company,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new SlugNotUniqueException();
      }
      throw error;
    }
  }

  getAll() {
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
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new SlugNotUniqueException();
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