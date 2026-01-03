import { BadRequestException } from '@nestjs/common';

export class EmailNotUniqueException extends BadRequestException {
  constructor() {
    super('Employee email must be unique');
  }
}
