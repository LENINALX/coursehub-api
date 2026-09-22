import { ConflictException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { CoursesService } from '../courses/courses.service.js';
import { StudentsService } from '../students/students.service.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsService', () => {
  let studentsService: Pick<StudentsService, 'findOne'>;
  let coursesService: Pick<CoursesService, 'findOne'>;
  let service: EnrollmentsService;

  beforeEach(() => {
    studentsService = {
      findOne: vi.fn().mockReturnValue({ id: 1, isActive: true }),
    };
    coursesService = {
      findOne: vi.fn().mockReturnValue({ id: 1 }),
    };
    service = new EnrollmentsService(
      studentsService as StudentsService,
      coursesService as CoursesService,
    );
  });

  it('creates enrollments with consecutive identifiers', () => {
    expect(service.create({ studentId: 1, courseId: 1 })).toEqual({
      id: 1,
      studentId: 1,
      courseId: 1,
    });
  });

  it('rejects duplicate student and course combinations', () => {
    service.create({ studentId: 1, courseId: 1 });

    expect(() => service.create({ studentId: 1, courseId: 1 })).toThrow(
      ConflictException,
    );
  });

  it('rejects inactive students', () => {
    studentsService.findOne = vi.fn().mockReturnValue({ id: 1, isActive: false });

    expect(() => service.create({ studentId: 1, courseId: 1 })).toThrow(
      'Inactive students cannot be enrolled',
    );
  });

  it('propagates a not found error for an unknown course', () => {
    coursesService.findOne = vi.fn().mockImplementation(() => {
      throw new NotFoundException('Course with ID 99 was not found');
    });

    expect(() => service.create({ studentId: 1, courseId: 99 })).toThrow(
      NotFoundException,
    );
  });

  it('filters and cancels enrollments', () => {
    service.create({ studentId: 1, courseId: 1 });
    service.create({ studentId: 1, courseId: 2 });

    expect(service.findAll({ studentId: '1', courseId: '2' })).toEqual([
      { id: 2, studentId: 1, courseId: 2 },
    ]);
    expect(service.remove(2)).toEqual({ id: 2, studentId: 1, courseId: 2 });
    expect(service.findAll({})).toEqual([{ id: 1, studentId: 1, courseId: 1 }]);
  });
});