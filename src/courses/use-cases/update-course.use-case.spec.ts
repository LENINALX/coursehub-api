import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type.js';
import { UserRole } from '../../users/user-role.enum.js';
import { Course } from '../entities/course.entity.js';
import {
  COURSE_REPOSITORY,
  CourseRepository,
} from '../repositories/course.repository.js';
import { UpdateCourseUseCase } from './update-course.use-case.js';

describe('UpdateCourseUseCase', () => {
  let useCase: UpdateCourseUseCase;
  const course: Course = {
    id: 1,
    title: 'Course',
    level: 'beginner',
    createdByUserId: 7,
    enrollments: [],
  };
  const repository: CourseRepository = {
    findById: vi.fn(),
    save: vi.fn(),
  };

  const teacher: AuthenticatedUser = {
    id: 7,
    email: 'teacher@example.com',
    role: UserRole.TEACHER,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateCourseUseCase,
        { provide: COURSE_REPOSITORY, useValue: repository },
      ],
    }).compile();
    useCase = moduleRef.get(UpdateCourseUseCase);
  });

  it('lets the course owner update and persists the changes', async () => {
    vi.mocked(repository.findById).mockResolvedValue({ ...course });
    vi.mocked(repository.save).mockImplementation(
      async (updatedCourse) => updatedCourse,
    );

    await expect(
      useCase.execute(1, { level: 'advanced' }, teacher),
    ).resolves.toMatchObject({ level: 'advanced' });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, level: 'advanced' }),
    );
  });

  it('forbids a teacher from changing another teacher’s course', async () => {
    vi.mocked(repository.findById).mockResolvedValue({
      ...course,
      createdByUserId: 99,
    });

    await expect(
      useCase.execute(1, { level: 'advanced' }, teacher),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows an administrator to update a course they do not own', async () => {
    vi.mocked(repository.findById).mockResolvedValue({
      ...course,
      createdByUserId: 99,
    });
    vi.mocked(repository.save).mockImplementation(
      async (updatedCourse) => updatedCourse,
    );

    await expect(
      useCase.execute(
        1,
        { level: 'advanced' },
        {
          ...teacher,
          role: UserRole.ADMIN,
        },
      ),
    ).resolves.toMatchObject({ level: 'advanced' });
  });

  it('returns not found when the course does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute(404, { level: 'advanced' }, teacher),
    ).rejects.toThrow(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
