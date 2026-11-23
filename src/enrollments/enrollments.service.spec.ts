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
  let enrollmentsRepository: Omit<
    Pick<
      Repository<Enrollment>,
      | 'findOne'
      | 'create'
      | 'save'
      | 'find'
      | 'findOneBy'
      | 'remove'
      | 'createQueryBuilder'
    >,
    'create' | 'createQueryBuilder'
  > & {
    create: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let queryBuilder: {
    leftJoinAndSelect: ReturnType<typeof vi.fn>;
    andWhere: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    skip: ReturnType<typeof vi.fn>;
    take: ReturnType<typeof vi.fn>;
    getManyAndCount: ReturnType<typeof vi.fn>;
  };
  let service: EnrollmentsService;

  beforeEach(() => {
    studentsRepository = {
      findOneBy: vi.fn().mockResolvedValue({ id: 1, isActive: true }),
    };
    coursesRepository = {
      findOneBy: vi.fn().mockResolvedValue({ id: 1 }),
    };
    queryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn(),
    };
    enrollmentsRepository = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(
        (values: { student: Student; course: Course }) => ({
          student: values.student,
          course: values.course,
        }),
      ),
      save: vi.fn().mockImplementation(async (enrollment) => ({
        id: 1,
        ...enrollment,
      })),
      find: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn(),
      remove: vi.fn().mockImplementation(async (enrollment) => enrollment),
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };
    service = new EnrollmentsService(
      enrollmentsRepository as unknown as Repository<Enrollment>,
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
    vi.mocked(queryBuilder.getManyAndCount).mockResolvedValue([
      [matchingEnrollment],
      1,
    ]);

    await expect(
      service.findAll({ studentId: '1', courseId: '2', page: 1, limit: 10 }),
    ).resolves.toEqual({
      items: [matchingEnrollment],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'student.id = :studentId',
      { studentId: 1 },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'course.id = :courseId',
      { courseId: 2 },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);

    vi.mocked(enrollmentsRepository.findOneBy).mockResolvedValue(
      matchingEnrollment,
    );
    await expect(service.remove(2)).resolves.toBe(matchingEnrollment);
    expect(enrollmentsRepository.remove).toHaveBeenCalledWith(
      matchingEnrollment,
    );
  });
});
