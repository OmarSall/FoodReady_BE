import { IsNotEmpty, IsString } from 'class-validator';
import { CanBeUndefined } from '../../utilities/can-be-undefined';

export class UpdateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @CanBeUndefined()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @CanBeUndefined()
  urlSlug?: string;
}