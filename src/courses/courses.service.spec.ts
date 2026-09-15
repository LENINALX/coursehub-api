import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service.js';

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoursesService],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a course with the next available identifier', () => {
    expect(
      service.create({
        title: 'Diseño de APIs',
        level: 'intermediate',
      }),
    ).toEqual({
      id: 4,
      title: 'Diseño de APIs',
      level: 'intermediate',
    });
  });
});
