import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type.js';
import { UserRole } from '../users/user-role.enum.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { Course } from './entities/course.entity.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {} // 1

  async findAll(query: CoursesQueryDto) {
    const { level, page, limit, sortBy, order } = query;
    const [items, total] = await this.coursesRepository.findAndCount({
      where: level ? { level } : {},
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOneBy({ id: Number(id) }); // 4
    if (!course) throw new NotFoundException(`Course ${id} not found`); // 5
    return course;
  }

  create(dto: CreateCourseDto, actor: AuthenticatedUser) {
    const course = this.coursesRepository.create({
      ...dto,
      createdByUserId: actor.id,
    });
    return this.coursesRepository.save(course);
  }

  async update(id: string, dto: UpdateCourseDto, actor: AuthenticatedUser) {
    const course = await this.findOne(id); // 7
    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwnerTeacher =
      actor.role === UserRole.TEACHER && course.createdByUserId === actor.id;

    if (!isAdmin && !isOwnerTeacher) {
      throw new ForbiddenException('You cannot modify this course');
    }

    Object.assign(course, dto);
    return this.coursesRepository.save(course); // 8
  }

  async remove(id: string) {
    const course = await this.findOne(id); // 9
    await this.coursesRepository.remove(course); // 10
    return course;
  }
}
