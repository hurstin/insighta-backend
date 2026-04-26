import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProfilesDto {
  @IsNotEmpty({ message: 'empty' })
  @IsString({ message: 'must be a string' })
  q: string;

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
