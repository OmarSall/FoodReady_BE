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
import type { RequestWithUser } from '../authentication/request-with-user';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { EmployeeRole } from '@prisma/client';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post('register')
  registerCompany(@Body() company: RegisterCompanyDto) {
    return this.companiesService.registerCompany(company);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('me')
  getMyCompany(@Req() request: RequestWithUser) {
    return this.companiesService.getById(request.user.companyId);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('me/employees')
  getMyCompanyEmployees(@Req() request: RequestWithUser) {
    const { user } = request;

    if (user.position !== EmployeeRole.OWNER) {
      throw new ForbiddenException('Only owner can list employees');
    }
    return this.employeesService.findAllForCompany(user.companyId);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Patch('me')
  updateMyCompany(
    @Body() company: UpdateCompanyDto,
    @Req() request: RequestWithUser,
  ) {
    const { user } = request;

    if (user.position !== EmployeeRole.OWNER) {
      throw new ForbiddenException('Only owner can update company');
    }

    return this.companiesService.update(user.companyId, company);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Delete('me')
  delete(@Req() request: RequestWithUser) {
    const { user } = request;

    if (user.position !== EmployeeRole.OWNER) {
      throw new ForbiddenException('Only owner can delete company');
    }

    return this.companiesService.delete(user.companyId);
  }
}
