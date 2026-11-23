import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user-role.enum.js';
import { CoursesController } from './courses.controller.js';
import { Course } from './entities/course.entity.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  const coursesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  };
  const updateCourseUseCase = {
    execute: vi.fn<UpdateCourseUseCase['execute']>(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    controller = new CoursesController(coursesService, updateCourseUseCase);
  });

  it('delegates update with the parsed ID, DTO, and authenticated actor', async () => {
    const actor = {
      id: 4,
      email: 'teacher@example.com',
      role: UserRole.TEACHER,
    };
    const dto = { title: 'NestJS avanzado' };
    const updatedCourse: Course = {
      id: 7,
      title: dto.title,
      level: 'beginner',
      createdByUserId: 4,
      enrollments: [],
    };
    updateCourseUseCase.execute.mockResolvedValue(updatedCourse);

    await expect(
      controller.update(7, dto, { user: actor }),
    ).resolves.toEqual(updatedCourse);
    expect(updateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, actor);
  });

  it('propagates business errors from the update use case', async () => {
    const forbidden = new ForbiddenException('You cannot modify this course');
    updateCourseUseCase.execute.mockRejectedValue(forbidden);

    await expect(
      controller.update(
        7,
        { title: 'Attempted change' },
        {
          user: {
            id: 9,
            email: 'other-teacher@example.com',
            role: UserRole.TEACHER,
          },
        },
      ),
    ).rejects.toBe(forbidden);
  });
});
