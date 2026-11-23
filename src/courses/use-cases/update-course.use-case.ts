import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type.js';
import { UserRole } from '../../users/user-role.enum.js';
import { UpdateCourseDto } from '../dto/update-course.dto.js';
import { COURSE_REPOSITORY } from '../repositories/course.repository.js';
import type { CourseRepository } from '../repositories/course.repository.js';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courses: CourseRepository,
  ) {}

  async execute(
    id: number,
    changes: UpdateCourseDto,
    actor: AuthenticatedUser,
  ) {
    const course = await this.courses.findById(id);
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwnerTeacher =
      actor.role === UserRole.TEACHER && course.createdByUserId === actor.id;
    if (!isAdmin && !isOwnerTeacher) {
      throw new ForbiddenException('You cannot modify this course');
    }

    Object.assign(course, changes);
    return this.courses.save(course);
  }
}
