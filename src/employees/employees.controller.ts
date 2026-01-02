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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { RequestWithUser } from '../authentication/request-with-user';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { EmployeeRole } from '@prisma/client';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {
  }

  @UseGuards(JwtAuthenticationGuard)
  @Post()
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() request: RequestWithUser
  ) {
    const currentUser = request.user;

    if (currentUser.position !== EmployeeRole.OWNER) {
      throw new ForbiddenException('Only owner can create employees');
    }
    return this.employeesService.createForCompany(currentUser.companyId, createEmployeeDto);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  findAll(@Req() request: RequestWithUser) {
    return this.employeesService.findAllForCompany(request.user.companyId);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findById(id);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() employee: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, employee);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.delete(id);
  }
}