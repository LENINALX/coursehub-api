import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesService } from '../courses/courses.service.js';
import { StudentsService } from '../students/students.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { FindEnrollmentsQueryDto } from './dto/find-enrollments-query.dto.js';

type Enrollment = {
  id: number;
  studentId: number;
  courseId: number;
};

@Injectable()
export class EnrollmentsService {
  private readonly enrollments: Enrollment[] = [];
  private nextId = 1;

  constructor(
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  create(createEnrollmentDto: CreateEnrollmentDto): Enrollment {
    const student = this.studentsService.findOne(createEnrollmentDto.studentId);
    this.coursesService.findOne(String(createEnrollmentDto.courseId));

    if (!student.isActive) {
      throw new ConflictException('Inactive students cannot be enrolled');
    }

    const enrollmentExists = this.enrollments.some(
      (enrollment) =>
        enrollment.studentId === createEnrollmentDto.studentId &&
        enrollment.courseId === createEnrollmentDto.courseId,
    );

    if (enrollmentExists) {
      throw new ConflictException(
        'The student is already enrolled in this course',
      );
    }

    const enrollment: Enrollment = {
      id: this.nextId++,
      ...createEnrollmentDto,
    };

    this.enrollments.push(enrollment);
    return enrollment;
  }

  findAll(filters: FindEnrollmentsQueryDto): Enrollment[] {
    return this.enrollments.filter((enrollment) => {
      const matchesStudent =
        !filters.studentId || enrollment.studentId === Number(filters.studentId);
      const matchesCourse =
        !filters.courseId || enrollment.courseId === Number(filters.courseId);

      return matchesStudent && matchesCourse;
    });
  }

  findByStudent(studentId: number): Enrollment[] {
    this.studentsService.findOne(studentId);
    return this.enrollments.filter(
      (enrollment) => enrollment.studentId === studentId,
    );
  }

  findByCourse(courseId: number): Enrollment[] {
    this.coursesService.findOne(String(courseId));
    return this.enrollments.filter(
      (enrollment) => enrollment.courseId === courseId,
    );
  }

  remove(id: number): Enrollment {
    const enrollment = this.enrollments.find((item) => item.id === id);

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} was not found`);
    }

    this.enrollments.splice(this.enrollments.indexOf(enrollment), 1);
    return enrollment;
  }
}