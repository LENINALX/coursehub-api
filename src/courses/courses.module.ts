import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Course } from './entities/course.entity.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Course]), AuthModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}