import { IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email:string;

  @IsOptional()
  @IsString()
  position?: string;
}