import { IsNotEmpty, IsString } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      return value;
    }
    const name: string = obj.name;
    return name.toLowerCase().replaceAll(' ','-');
  })
  slugUrl: string;
}