import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateEmployeeDto } from '../employees/dto/create-employee.dto';
import { EmployeesService } from '../employees/employees.service';
import { RegisterCompanyDto } from './dto/register-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly employeesService: EmployeesService,
  ) {
  }

  @Post()
  create(
    @Body() company: CreateCompanyDto,
  ) {
    return this.companiesService.create(company);
  }

  @Post('register')
  registerCompany(@Body() company: RegisterCompanyDto) {
    return this.companiesService.registerCompany(company);
  }

  @Post(':id/employees')
  createEmployeeForCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() employee: CreateEmployeeDto,
  ) {
    return this.employeesService.createForCompany(id, employee);
  }

  @Get()
  getAll() {
    return this.companiesService.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getById(id);
  }

  @Get(':id/employees')
  getEmployeesForCompany(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findByCompany(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() company: UpdateCompanyDto) {
    return this.companiesService.update(id, company);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.companiesService.delete(id);
  }
}