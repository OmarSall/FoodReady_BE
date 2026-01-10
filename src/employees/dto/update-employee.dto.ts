import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CanBeUndefined } from '../../utilities/can-be-undefined';
import { EmployeeRole } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsString()
  @MinLength(2)
  @CanBeUndefined()
  name?: string;

  @IsEmail()
  @CanBeUndefined()
  email?: string;

  @IsEnum(EmployeeRole)
  @CanBeUndefined()
  position?: EmployeeRole;
}
