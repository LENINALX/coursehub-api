import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/user-role.enum.js';
import { CoursesController } from '../courses/courses.controller.js';
import { CoursesService } from '../courses/courses.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

const JWT_SECRET = 'local-test-secret-with-at-least-32-characters';

describe('JWT protected routes', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const createCourse = vi.fn();
  const updateCourse = vi.fn();
  const removeCourse = vi.fn();
  const login = vi.fn();
  const register = vi.fn();

  beforeEach(async () => {
    createCourse.mockReset();
    createCourse.mockResolvedValue({
      id: 1,
      title: 'Diseño de APIs',
      level: 'intermediate',
      createdByUserId: 7,
    });
    updateCourse.mockResolvedValue({ id: 1 });
    removeCourse.mockResolvedValue({ id: 1 });
    login.mockResolvedValue({ accessToken: 'test-token', user: { id: 7 } });
    register.mockResolvedValue({ id: 8, role: UserRole.STUDENT });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
      ],
      controllers: [AuthController, CoursesController],
      providers: [
        JwtStrategy,
        RolesGuard,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => JWT_SECRET },
        },
        { provide: AuthService, useValue: { login, register } },
        {
          provide: CoursesService,
          useValue: {
            create: createCourse,
            update: updateCourse,
            remove: removeCourse,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwtService = moduleFixture.get(JwtService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createToken(
    role: UserRole | undefined = UserRole.TEACHER,
    id = 7,
  ) {
    return jwtService.signAsync({ sub: id, email: 'ana@example.com', role });
  }

  it('returns the authenticated identity from GET /auth/me', async () => {
    const token = await createToken();

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ id: 7, email: 'ana@example.com', role: UserRole.TEACHER });
  });

  it('rejects missing and altered tokens on GET /auth/me', async () => {
    const token = await createToken();
    const [header, payload, signature] = token.split('.');
    const alteredSignature = signature?.replace(
      /^./,
      (character) => (character === 'a' ? 'b' : 'a'),
    );
    const alteredToken = `${header}.${payload}.${alteredSignature}`;

    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${alteredToken}`)
      .expect(401);
  });

  it('rejects course creation without a token before changing data', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Diseño de APIs', level: 'intermediate' })
      .expect(401);

    expect(createCourse).not.toHaveBeenCalled();
  });

  it('keeps course DTO validation and creation behavior with a valid token', async () => {
    const token = await createToken();
    const server = app.getHttpServer();

    await request(server)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', level: 'expert' })
      .expect(400);

    expect(createCourse).not.toHaveBeenCalled();

    await request(server)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Diseño de APIs', level: 'intermediate' })
      .expect(201)
      .expect({
        id: 1,
        title: 'Diseño de APIs',
        level: 'intermediate',
        createdByUserId: 7,
      });

    expect(createCourse).toHaveBeenCalledWith(
      { title: 'Diseño de APIs', level: 'intermediate' },
      { id: 7, email: 'ana@example.com', role: UserRole.TEACHER },
    );
  });

  it('requires an admin role for course deletion', async () => {
    const studentToken = await createToken(UserRole.STUDENT);
    const tokenWithoutRole = await createToken(undefined);

    await request(app.getHttpServer()).delete('/courses/1').expect(401);
    await request(app.getHttpServer())
      .delete('/courses/1')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete('/courses/1')
      .set('Authorization', `Bearer ${tokenWithoutRole}`)
      .expect(403);

    const adminToken = await createToken(UserRole.ADMIN);
    await request(app.getHttpServer())
      .delete('/courses/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(removeCourse).toHaveBeenCalledWith('1');
  });

  it('rate limits repeated login requests', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ana@example.com', password: 'valid-password' })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'valid-password' })
      .expect(429);
    expect(login).toHaveBeenCalledTimes(5);
  });

  it('does not allow choosing a privileged role during registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'new-user@example.com',
        password: 'secure-password',
        role: UserRole.ADMIN,
      })
      .expect(400);

    expect(register).not.toHaveBeenCalled();
  });

  it('permits teacher updates through the guard and passes the identity to the service', async () => {
    const teacherToken = await createToken(UserRole.TEACHER, 9);

    await request(app.getHttpServer())
      .patch('/courses/1')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ level: 'advanced' })
      .expect(200);

    expect(updateCourse).toHaveBeenCalledWith(
      '1',
      { level: 'advanced' },
      { id: 9, email: 'ana@example.com', role: UserRole.TEACHER },
    );
  });
});
