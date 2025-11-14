import { NotFoundException } from '@nestjs/common';

export class CompanyNotFoundException extends NotFoundException {
  constructor(companyId: number) {
    super(`Company with id ${companyId} not found`);
  }
}