import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class FindStudentsQueryDto {
  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @Matches(/^(?:[1-9]|10)$/)
  semester?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: string;
}