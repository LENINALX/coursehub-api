import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { vi } from 'vitest';
import { Course } from '../courses/entities/course.entity.js';
import { Student } from '../students/entities/student.entity.js';
import { Enrollment } from './entiti/enrollment.entity.js';
import { EnrollmentsService } from './enrollments.service.js';

describe('EnrollmentsService', () => {
  let studentsRepository: Pick<Repository<Student>, 'findOneBy'>;
  let coursesRepository: Pick<Repository<Course>, 'findOneBy'>;
  let enrollmentsRepository: Pick<
    Repository<Enrollment>,
    'findOne' | 'create' | 'save' | 'find' | 'findOneBy' | 'remove'
  >;
  let service: EnrollmentsService;

  beforeEach(() => {
    studentsRepository = {
      findOneBy: vi.fn().mockResolvedValue({ id: 1, isActive: true }),
    };
    coursesRepository = {
      findOneBy: vi.fn().mockResolvedValue({ id: 1 }),
    };
    enrollmentsRepository = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn(({ student, course }) => ({ student, course })),
      save: vi.fn().mockImplementation(async (enrollment) => ({
        id: 1,
        ...enrollment,
      })),
      find: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn(),
      remove: vi.fn().mockImplementation(async (enrollment) => enrollment),
    };
    service = new EnrollmentsService(
      enrollmentsRepository as Repository<Enrollment>,
      studentsRepository as Repository<Student>,
      coursesRepository as Repository<Course>,
    );
  });

  it('creates an enrollment after validating the student and course', async () => {
    await expect(
      service.create({ studentId: 1, courseId: 1 }),
    ).resolves.toMatchObject({
      id: 1,
      student: { id: 1 },
      course: { id: 1 },
    });
  });

  it('rejects duplicate student and course combinations', async () => {
    vi.mocked(enrollmentsRepository.findOne).mockResolvedValue({
      id: 1,
    } as Enrollment);

    await expect(
      service.create({ studentId: 1, courseId: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects inactive students', async () => {
    vi.mocked(studentsRepository.findOneBy).mockResolvedValue({
      id: 1,
      isActive: false,
    } as Student);

    await expect(
      service.create({ studentId: 1, courseId: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unknown students and courses', async () => {
    vi.mocked(studentsRepository.findOneBy).mockResolvedValueOnce(null);
    await expect(
      service.create({ studentId: 99, courseId: 1 }),
    ).rejects.toThrow(NotFoundException);

    vi.mocked(coursesRepository.findOneBy).mockResolvedValueOnce(null);
    await expect(
      service.create({ studentId: 1, courseId: 99 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('filters and removes enrollments', async () => {
    const matchingEnrollment = { id: 2 } as Enrollment;
    vi.mocked(enrollmentsRepository.find).mockResolvedValue([
      matchingEnrollment,
    ]);

    await expect(
      service.findAll({ studentId: '1', courseId: '2' }),
    ).resolves.toEqual([matchingEnrollment]);
    expect(enrollmentsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student: { id: 1 }, course: { id: 2 } },
      }),
    );

    vi.mocked(enrollmentsRepository.findOneBy).mockResolvedValue(
      matchingEnrollment,
    );
    await expect(service.remove(2)).resolves.toBe(matchingEnrollment);
    expect(enrollmentsRepository.remove).toHaveBeenCalledWith(
      matchingEnrollment,
    );
  });
});
