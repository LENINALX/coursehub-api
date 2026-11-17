import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  const coursesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret' }),
      ],
      controllers: [CoursesController],
      providers: [
        RolesGuard,
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
