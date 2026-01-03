import { NotFoundException } from '@nestjs/common';

export class EmployeeEmailNotFoundException extends NotFoundException {
  constructor(employeeEmail: string) {
    super(`Employee with email ${employeeEmail} not found`);
  }
}
