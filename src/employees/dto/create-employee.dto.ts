import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmployeeRole } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsEnum(EmployeeRole)
  position: EmployeeRole;
}
