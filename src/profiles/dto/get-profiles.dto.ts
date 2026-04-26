import { IsOptional, IsString, IsInt, IsNumber, Min, Max, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProfilesDto {
  @IsOptional()
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'empty' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'empty' })
  age_group?: string;

  @IsOptional()
  @IsString({ message: 'must be a string' })
  @IsNotEmpty({ message: 'empty' })
  country_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'must be an integer' })
  min_age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'must be an integer' })
  max_age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'must be a number' })
  min_gender_probability?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'must be a number' })
  min_country_probability?: number;

  @IsOptional()
  @IsEnum(['age', 'created_at', 'gender_probability'], { message: 'must be a valid sort field' })
  sort_by?: 'age' | 'created_at' | 'gender_probability';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'must be a valid order' })
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'must be an integer' })
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'must be an integer' })
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
