import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { EmployeesService } from '../employees/employees.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RequestWithUser } from '../authentication/request-with-user';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { EmployeeRole } from '@prisma/client';
import type { Request } from "express";

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly employeesService: EmployeesService,
  ) {
  }

  @Post('register')
  registerCompany(@Body() company: RegisterCompanyDto) {
    return this.companiesService.registerCompany(company);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  getAll() {
    return this.companiesService.getAll();
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getById(id);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id/employees')
  getEmployeesForCompany(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    ) {
    const user = (request as unknown as RequestWithUser).user
    if (user.companyId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.employeesService.findByCompany(id);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() company: UpdateCompanyDto,
    @Req() request: Request,
    ){
    const user = (request as unknown as RequestWithUser).user;

    if (user.companyId !== id) {
      throw new ForbiddenException('Access denied');
    }
    if (user.position !== EmployeeRole.OWNER) {
      throw new ForbiddenException('Only owner can update company');
    }

    return this.companiesService.update(id, company);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    ) {
    const user = (request as unknown as RequestWithUser).user;

    if (user.companyId !== id) {
      throw new ForbiddenException('Access denied');
    }
    if (user.position !== EmployeeRole.OWNER) {
      throw new ForbiddenException('Only owner can delete company');
    }

    return await this.companiesService.delete(id);
  }
}