import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity.js';
import { Student } from '../students/entities/student.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { FindEnrollmentsQueryDto } from './dto/find-enrollments-query.dto.js';
import { Enrollment } from './entiti/enrollment.entity.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentsRepository.findOneBy({
      id: dto.studentId,
    });
    if (!student) {
      throw new NotFoundException(`Student ${dto.studentId} not found`);
    }
    if (!student.isActive) {
      throw new BadRequestException('Inactive students cannot enroll');
    }

    const course = await this.coursesRepository.findOneBy({
      id: dto.courseId,
    });
    if (!course) {
      throw new NotFoundException(`Course ${dto.courseId} not found`);
    }

    const duplicate = await this.enrollmentsRepository.findOne({
      where: { student: { id: student.id }, course: { id: course.id } },
    });
    if (duplicate) {
      throw new ConflictException(
        'Student is already enrolled in this course',
      );
    }

    return this.enrollmentsRepository.save(
      this.enrollmentsRepository.create({ student, course }),
    );
  }

  findAll(filters: FindEnrollmentsQueryDto): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: {
        ...(filters.studentId
          ? { student: { id: Number(filters.studentId) } }
          : {}),
        ...(filters.courseId
          ? { course: { id: Number(filters.courseId) } }
          : {}),
      },
      relations: { student: true, course: true },
      order: { id: 'ASC' },
    });
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    const student = await this.studentsRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    return this.enrollmentsRepository.find({
      where: { student: { id: studentId } },
      relations: { student: true, course: true },
      order: { id: 'ASC' },
    });
  }

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    const course = await this.coursesRepository.findOneBy({ id: courseId });
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    return this.enrollmentsRepository.find({
      where: { course: { id: courseId } },
      relations: { student: true, course: true },
      order: { id: 'ASC' },
    });
  }

  async remove(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findOneBy({ id });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} was not found`);
    }

    await this.enrollmentsRepository.remove(enrollment);
    return enrollment;
  }
}
