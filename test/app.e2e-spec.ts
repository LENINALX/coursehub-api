import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { Course } from '../src/courses/entities/course.entity.js';
import { Enrollment } from '../src/enrollments/entiti/enrollment.entity.js';
import { Student } from '../src/students/entities/student.entity.js';
import { User } from '../src/users/entities/user.entity.js';
import { UserRole } from '../src/users/user-role.enum.js';

type CourseRow = Pick<
  Course,
  'id' | 'title' | 'level' | 'createdByUserId'
>;
type StudentRow = Pick<
  Student,
  'id' | 'name' | 'email' | 'age' | 'career' | 'semester' | 'isActive'
>;
type EnrollmentRow = Pick<Enrollment, 'id' | 'student' | 'course'>;
type UserRow = Pick<User, 'id' | 'email' | 'passwordHash' | 'role' | 'createdAt'>;

const INITIAL_COURSE: CourseRow = {
  id: 1,
  title: 'NestJS Fundamentals',
  level: 'beginner',
  createdByUserId: 99,
};

function createRepositories() {
  const courses: CourseRow[] = [{ ...INITIAL_COURSE }];
  const students: StudentRow[] = [];
  const enrollments: EnrollmentRow[] = [];
  const users: UserRow[] = [];
  let nextCourseId = 2;
  let nextStudentId = 1;
  let nextEnrollmentId = 1;
  let nextUserId = 1;

  const courseRepository = {
    findAndCount: vi.fn(
      async (options: {
        where?: Partial<CourseRow>;
        skip?: number;
        take?: number;
      }) => {
        const filtered = courses.filter(
          (course) =>
            !options.where?.level || course.level === options.where.level,
        );
        const skip = options.skip ?? 0;
        const take = options.take ?? filtered.length;
        return [filtered.slice(skip, skip + take), filtered.length] as const;
      },
    ),
    findOneBy: vi.fn(async (criteria: Partial<CourseRow>) =>
      courses.find((course) =>
        Object.entries(criteria).every(
          ([key, value]) => course[key as keyof CourseRow] === value,
        ),
      ) ?? null,
    ),
    create: vi.fn(
      (values: Pick<CourseRow, 'title' | 'level'> & Pick<CourseRow, 'createdByUserId'>) => ({
        id: 0,
        ...values,
      }),
    ),
    save: vi.fn(async (course: CourseRow) => {
      const saved = {
        ...course,
        id: course.id || nextCourseId++,
      };
      const index = courses.findIndex((item) => item.id === saved.id);
      if (index === -1) {
        courses.push(saved);
      } else {
        courses[index] = saved;
      }
      return saved;
    }),
    remove: vi.fn(async (course: CourseRow) => {
      const index = courses.findIndex((item) => item.id === course.id);
      if (index !== -1) {
        courses.splice(index, 1);
      }
      return course;
    }),
  };

  const studentRepository = {
    findOneBy: vi.fn(async (criteria: Partial<StudentRow>) =>
      students.find((student) =>
        Object.entries(criteria).every(
          ([key, value]) => student[key as keyof StudentRow] === value,
        ),
      ) ?? null,
    ),
    find: vi.fn(async (options: { where?: Partial<StudentRow> }) =>
      students.filter((student) =>
        Object.entries(options.where ?? {}).every(
          ([key, value]) => student[key as keyof StudentRow] === value,
        ),
      ),
    ),
    create: vi.fn((values: Omit<StudentRow, 'id'>) => ({
      id: 0,
      ...values,
    })),
    save: vi.fn(async (student: StudentRow) => {
      const saved = {
        ...student,
        id: student.id || nextStudentId++,
      };
      const index = students.findIndex((item) => item.id === saved.id);
      if (index === -1) {
        students.push(saved);
      } else {
        students[index] = saved;
      }
      return saved;
    }),
    remove: vi.fn(async (student: StudentRow) => {
      const index = students.findIndex((item) => item.id === student.id);
      if (index !== -1) {
        students.splice(index, 1);
      }
      return student;
    }),
  };

  const enrollmentRepository = {
    findOne: vi.fn(
      async (options: {
        where: { student: { id: number }; course: { id: number } };
      }) =>
        enrollments.find(
          (enrollment) =>
            enrollment.student.id === options.where.student.id &&
            enrollment.course.id === options.where.course.id,
        ) ?? null,
    ),
    create: vi.fn(
      (values: Pick<EnrollmentRow, 'student' | 'course'>) => ({
        id: 0,
        ...values,
      }),
    ),
    save: vi.fn(async (enrollment: EnrollmentRow) => {
      const saved = {
        ...enrollment,
        id: enrollment.id || nextEnrollmentId++,
      };
      enrollments.push(saved);
      return saved;
    }),
    find: vi.fn(async () => enrollments),
    findOneBy: vi.fn(async (criteria: Partial<EnrollmentRow>) =>
      enrollments.find((enrollment) =>
        Object.entries(criteria).every(
          ([key, value]) => enrollment[key as keyof EnrollmentRow] === value,
        ),
      ) ?? null,
    ),
    remove: vi.fn(async (enrollment: EnrollmentRow) => {
      const index = enrollments.findIndex((item) => item.id === enrollment.id);
      if (index !== -1) {
        enrollments.splice(index, 1);
      }
      return enrollment;
    }),
    createQueryBuilder: vi.fn(() => {
      const builder = {
        leftJoinAndSelect: vi.fn(() => builder),
        andWhere: vi.fn(() => builder),
        orderBy: vi.fn(() => builder),
        skip: vi.fn(() => builder),
        take: vi.fn(() => builder),
        getManyAndCount: vi.fn(async () => [enrollments, enrollments.length]),
      };
      return builder;
    }),
  };

  const userRepository = {
    findOneBy: vi.fn(async (criteria: Partial<UserRow>) =>
      users.find((user) =>
        Object.entries(criteria).every(
          ([key, value]) => user[key as keyof UserRow] === value,
        ),
      ) ?? null,
    ),
    create: vi.fn(
      (values: Pick<UserRow, 'email' | 'passwordHash'>): UserRow => ({
        id: 0,
        ...values,
        role: UserRole.STUDENT,
        createdAt: new Date(),
      }),
    ),
    save: vi.fn(async (user: UserRow) => {
      const saved = {
        ...user,
        id: user.id || nextUserId++,
      };
      users.push(saved);
      return saved;
    }),
    createQueryBuilder: vi.fn(() => {
      let email = '';
      const builder = {
        addSelect: vi.fn(() => builder),
        where: vi.fn((_clause: string, parameters: { email: string }) => {
          email = parameters.email;
          return builder;
        }),
        getOne: vi.fn(async () => users.find((user) => user.email === email) ?? null),
      };
      return builder;
    }),
  };

  return {
    courseRepository,
    studentRepository,
    enrollmentRepository,
    userRepository,
  };
}

describe('CourseHub API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let teacherAuthorization: string;
  let secondTeacherAuthorization: string;
  let studentAuthorization: string;
  let adminAuthorization: string;

  beforeEach(async () => {
    const repositories = createRepositories();
    const fakeDataSource = { manager: {}, isInitialized: false };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(fakeDataSource)
      .overrideProvider(getRepositoryToken(Course))
      .useValue(repositories.courseRepository)
      .overrideProvider(getRepositoryToken(Student))
      .useValue(repositories.studentRepository)
      .overrideProvider(getRepositoryToken(Enrollment))
      .useValue(repositories.enrollmentRepository)
      .overrideProvider(getRepositoryToken(User))
      .useValue(repositories.userRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
    teacherAuthorization = await createAuthorization(1, 'teacher');
    secondTeacherAuthorization = await createAuthorization(2, 'teacher');
    studentAuthorization = await createAuthorization(3, 'student');
    adminAuthorization = await createAuthorization(4, 'admin');
  });

  async function createAuthorization(id: number, role: string) {
    const token = await jwtService.signAsync({
      sub: id,
      email: `user-${id}@example.com`,
      role,
    });
    return `Bearer ${token}`;
  }

  it('serves the root health route', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('CourseHub API esta en linea');
  });

  it('registers, logs in, and resolves the authenticated profile', async () => {
    const credentials = {
      email: 'e2e-user@example.com',
      password: 'e2e-password-2026',
    };

    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);
    expect(registration.body).toMatchObject({
      id: 1,
      email: credentials.email,
      role: UserRole.STUDENT,
    });
    expect(registration.body).not.toHaveProperty('passwordHash');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);
    expect(login.body).toMatchObject({
      user: {
        id: 1,
        email: credentials.email,
        role: UserRole.STUDENT,
      },
    });
    expect(login.body.accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect({
        id: 1,
        email: credentials.email,
        role: UserRole.STUDENT,
      });
  });

  it('rejects missing and altered JWTs on a protected route', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    const validToken = (await teacherAuthorization).replace('Bearer ', '');
    const [header, payload, signature] = validToken.split('.');
    const alteredToken = `${header}.${payload}.${signature?.replace(/^./, (c) =>
      c === 'a' ? 'b' : 'a',
    )}`;
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${alteredToken}`)
      .expect(401);
  });

  it('requires authentication before creating a course', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'No token', level: 'beginner' })
      .expect(401);
  });

  it('creates a course with its owner from the token and allows that owner to update it', async () => {
    const created = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', teacherAuthorization)
      .send({ title: 'Owned course', level: 'beginner' })
      .expect(201);

    expect(created.body).toMatchObject({
      id: 2,
      title: 'Owned course',
      createdByUserId: 1,
    });

    await request(app.getHttpServer())
      .patch('/courses/2')
      .set('Authorization', teacherAuthorization)
      .send({ level: 'advanced' })
      .expect(200)
      .expect({
        id: 2,
        title: 'Owned course',
        level: 'advanced',
        createdByUserId: 1,
      });

    await request(app.getHttpServer())
      .get('/courses/2')
      .expect(200)
      .expect({
        id: 2,
        title: 'Owned course',
        level: 'advanced',
        createdByUserId: 1,
      });
  });

  it('forbids another teacher from updating a course without changing it', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', teacherAuthorization)
      .send({ title: 'Teacher one course', level: 'beginner' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/courses/2')
      .set('Authorization', secondTeacherAuthorization)
      .send({ level: 'advanced' })
      .expect(403);

    await request(app.getHttpServer())
      .get('/courses/2')
      .expect(200)
      .expect({
        id: 2,
        title: 'Teacher one course',
        level: 'beginner',
        createdByUserId: 1,
      });
  });

  it('allows an administrator to update a course they do not own', async () => {
    await request(app.getHttpServer())
      .patch('/courses/1')
      .set('Authorization', adminAuthorization)
      .send({ level: 'advanced' })
      .expect(200)
      .expect({
        id: 1,
        title: 'NestJS Fundamentals',
        level: 'advanced',
        createdByUserId: 99,
      });
  });

  it('forbids a student from updating a course', async () => {
    await request(app.getHttpServer())
      .patch('/courses/1')
      .set('Authorization', studentAuthorization)
      .send({ level: 'advanced' })
      .expect(403);
  });

  it('validates course bodies and rejects unexpected fields', async () => {
    const server = request(app.getHttpServer());

    await server
      .post('/courses')
      .set('Authorization', teacherAuthorization)
      .send({ title: '', level: 'beginner' })
      .expect(400);
    await server
      .post('/courses')
      .set('Authorization', teacherAuthorization)
      .send({ title: 'Invalid level', level: 'expert' })
      .expect(400);
    await server
      .post('/courses')
      .set('Authorization', teacherAuthorization)
      .send({ title: 'Unexpected property', level: 'beginner', duration: 20 })
      .expect(400);
  });

  it('returns consistent errors for invalid and missing course identifiers', async () => {
    const invalid = await request(app.getHttpServer())
      .patch('/courses/not-a-number')
      .set('Authorization', adminAuthorization)
      .send({ level: 'advanced' })
      .expect(400);

    expect(invalid.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/courses/not-a-number',
        timestamp: expect.any(String),
        message: expect.any(String),
      }),
    );
    expect(invalid.body.stack).toBeUndefined();

    await request(app.getHttpServer())
      .patch('/courses/999')
      .set('Authorization', adminAuthorization)
      .send({ level: 'advanced' })
      .expect(404);
  });

  it('deletes a course as an administrator and rejects a repeated deletion', async () => {
    await request(app.getHttpServer())
      .delete('/courses/1')
      .set('Authorization', adminAuthorization)
      .expect(200)
      .expect({
        id: 1,
        title: 'NestJS Fundamentals',
        level: 'beginner',
        createdByUserId: 99,
      });

    await request(app.getHttpServer()).get('/courses/1').expect(404);
    await request(app.getHttpServer())
      .delete('/courses/1')
      .set('Authorization', adminAuthorization)
      .expect(404);
  });

  it('creates students, rejects duplicate emails, and filters results', async () => {
    const student = {
      name: 'Ana Torres',
      email: 'ana.torres@example.com',
      age: 20,
      career: 'Software Engineering',
      semester: 3,
      isActive: true,
    };

    await request(app.getHttpServer())
      .post('/students')
      .send(student)
      .expect(201)
      .expect({ id: 1, ...student });
    await request(app.getHttpServer())
      .post('/students')
      .send(student)
      .expect(409);
    await request(app.getHttpServer())
      .post('/students')
      .send({ ...student, email: 'other@example.com', semester: 4 })
      .expect(201);

    await request(app.getHttpServer())
      .get('/students')
      .query({
        career: 'Software Engineering',
        semester: '3',
        isActive: 'true',
      })
      .expect(200)
      .expect([{ id: 1, ...student }]);
  });

  it('updates students partially and validates immutable fields and semester range', async () => {
    const student = {
      name: 'Ana Torres',
      email: 'ana.torres@example.com',
      age: 20,
      career: 'Software Engineering',
      semester: 3,
      isActive: true,
    };
    await request(app.getHttpServer()).post('/students').send(student).expect(201);

    await request(app.getHttpServer())
      .patch('/students/1')
      .send({ career: 'Data Science', semester: 4 })
      .expect(200)
      .expect({ id: 1, ...student, career: 'Data Science', semester: 4 });
    await request(app.getHttpServer())
      .patch('/students/1')
      .send({ id: 2 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/students')
      .send({ ...student, email: 'invalid-semester@example.com', semester: 11 })
      .expect(400);
  });

  it('prevents deleting inactive students and allows deletion after reactivation', async () => {
    const student = {
      name: 'Ana Torres',
      email: 'ana.torres@example.com',
      age: 20,
      career: 'Software Engineering',
      semester: 3,
      isActive: true,
    };
    await request(app.getHttpServer()).post('/students').send(student).expect(201);

    await request(app.getHttpServer())
      .patch('/students/1/status')
      .send({ isActive: false })
      .expect(200);
    await request(app.getHttpServer()).delete('/students/1').expect(409);
    await request(app.getHttpServer())
      .patch('/students/1/status')
      .send({ isActive: true })
      .expect(200);
    await request(app.getHttpServer()).delete('/students/1').expect(200);
  });

  it('returns 400 for malformed student IDs and 404 for missing students', async () => {
    await request(app.getHttpServer())
      .get('/students/not-a-number')
      .expect(400);
    await request(app.getHttpServer()).get('/students/999').expect(404);
    await request(app.getHttpServer())
      .patch('/students/999')
      .send({ semester: 4 })
      .expect(404);
    await request(app.getHttpServer()).delete('/students/999').expect(404);
  });

  it('creates an enrollment and rejects duplicate or inactive student enrollments', async () => {
    const student = {
      name: 'Enrollment Student',
      email: 'enrollment.student@example.com',
      age: 21,
      career: 'Software Engineering',
      semester: 4,
      isActive: true,
    };
    await request(app.getHttpServer()).post('/students').send(student).expect(201);

    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: 1, courseId: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: 1, courseId: 1 })
      .expect(409);

    await request(app.getHttpServer())
      .patch('/students/1/status')
      .send({ isActive: false })
      .expect(200);
    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: 1, courseId: 1 })
      .expect(400);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
