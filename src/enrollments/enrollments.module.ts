import { Module } from '@nestjs/common';
import { Course } from '../courses/entities/course.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './entiti/enrollment.entity.js';
import { Student } from '../students/entities/student.entity.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Student, Course])],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}