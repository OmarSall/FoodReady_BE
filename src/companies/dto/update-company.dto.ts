import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { CanBeUndefined } from '../../utilities/can-be-undefined';

export class UpdateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @CanBeUndefined()
  companyName?: string;
}