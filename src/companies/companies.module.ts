import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { EmployeesModule } from '../employees/employees.module';
import { EmployeesService } from '../employees/employees.service';

@Module({
  imports: [DatabaseModule, EmployeesModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
