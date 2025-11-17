import { ConflictException } from '@nestjs/common';

export class SlugNotUniqueException extends ConflictException {
  constructor() {
    super('The provided slug is not unique');
  }
}