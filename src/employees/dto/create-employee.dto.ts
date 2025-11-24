import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email:string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}