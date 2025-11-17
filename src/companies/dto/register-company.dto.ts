import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class RegisterCompanyDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      return value;
    }
    const name: string = obj.companyName;
    return name.toLowerCase().replaceAll(' ','-');
  })
  slugUrl: string;
}