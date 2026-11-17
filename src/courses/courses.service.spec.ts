import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { Course } from './entities/course.entity.js';
import { CoursesService } from './courses.service.js';
import { UserRole } from '../users/user-role.enum.js';

describe('CoursesService', () => {
  let service: CoursesService;
  const coursesRepository = {
    create: vi.fn((course: Record<string, unknown>) => course),
    save: vi.fn(async (course: Record<string, unknown>) => ({
      id: 4,
      ...course,
    })),
    findOneBy: vi.fn(),
    findAndCount: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: coursesRepository,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('records the authenticated teacher as the course owner', async () => {
    await expect(
      service.create(
        { title: 'Diseño de APIs', level: 'intermediate' },
        { id: 2, email: 'teacher@example.com', role: UserRole.TEACHER },
      ),
    ).resolves.toEqual({
      id: 4,
      title: 'Diseño de APIs',
      level: 'intermediate',
      createdByUserId: 2,
    });
    expect(coursesRepository.create).toHaveBeenCalledWith({
      title: 'Diseño de APIs',
      level: 'intermediate',
      createdByUserId: 2,
    });
  });

  it('rejects a teacher updating a course owned by someone else', async () => {
    coursesRepository.findOneBy.mockResolvedValue({
      id: 1,
      title: 'Course',
      level: 'beginner',
      createdByUserId: 3,
    });

    await expect(
      service.update(
        '1',
        { level: 'advanced' },
        { id: 2, email: 'teacher@example.com', role: UserRole.TEACHER },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(coursesRepository.save).not.toHaveBeenCalled();
  });

  it('allows the owning teacher to update their course', async () => {
    coursesRepository.findOneBy.mockResolvedValue({
      id: 1,
      title: 'Course',
      level: 'beginner',
      createdByUserId: 2,
    });

    await service.update(
      '1',
      { level: 'advanced' },
      { id: 2, email: 'teacher@example.com', role: UserRole.TEACHER },
    );

    expect(coursesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, level: 'advanced' }),
    );
  });
});
