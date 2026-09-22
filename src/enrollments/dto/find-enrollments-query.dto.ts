import { IsOptional, IsString, Matches } from 'class-validator';

export class FindEnrollmentsQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  studentId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  courseId?: string;
}