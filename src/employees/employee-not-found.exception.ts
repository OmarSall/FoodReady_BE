import { NotFoundException } from '@nestjs/common';

export class EmployeeNotFoundException extends NotFoundException {
  constructor(employeeId: number) {
    super(`Employee with id ${employeeId} not found`);
  }
}
