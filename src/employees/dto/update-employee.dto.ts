import { IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { CanBeUndefined } from '../../utilities/can-be-undefined';

export class UpdateEmployeeDto {
  @IsString()
  @MinLength(2)
  @CanBeUndefined()
  name?: string;

  @IsEmail()
  @CanBeUndefined()
  email?:string;

  @IsOptional()
  @IsString()
  @CanBeUndefined()
  position?: string;
}