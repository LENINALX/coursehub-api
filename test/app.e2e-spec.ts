import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('CourseHub API esta en linea');
  });

  it('/courses (POST) creates a valid course', () => {
    return request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Diseño de APIs', level: 'intermediate' })
      .expect(201)
      .expect({ id: 4, title: 'Diseño de APIs', level: 'intermediate' });
  });

  it('/courses (POST) rejects an empty title', () => {
    return request(app.getHttpServer())
      .post('/courses')
      .send({ title: '', level: 'beginner' })
      .expect(400);
  });

  it('/courses (POST) rejects an unsupported level', () => {
    return request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Diseño de APIs', level: 'expert' })
      .expect(400);
  });

  it('/courses (POST) rejects unexpected fields', () => {
    return request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Diseño de APIs', level: 'intermediate', duration: 20 })
      .expect(400);
  });

  it('/courses/:id (PATCH) updates only the supplied fields', async () => {
    const server = app.getHttpServer();

    await request(server)
      .patch('/courses/1')
      .send({ level: 'advanced' })
      .expect(200)
      .expect({ id: 1, title: 'NestJS Fundamentals', level: 'advanced' });

    await request(server)
      .get('/courses/1')
      .expect(200)
      .expect({ id: 1, title: 'NestJS Fundamentals', level: 'advanced' });
  });

  it('/courses/:id (PATCH) rejects an unsupported level', async () => {
    const server = app.getHttpServer();

    await request(server)
      .patch('/courses/1')
      .send({ level: 'expert' })
      .expect(400);

    await request(server)
      .get('/courses/1')
      .expect(200)
      .expect({ id: 1, title: 'NestJS Fundamentals', level: 'beginner' });
  });

  it('/courses/:id (PATCH) returns 404 for a missing course', () => {
    return request(app.getHttpServer())
      .patch('/courses/999')
      .send({ level: 'advanced' })
      .expect(404);
  });

  it('/courses/:id (DELETE) removes a course and rejects repeated requests', async () => {
    const server = app.getHttpServer();

    await request(server)
      .delete('/courses/1')
      .expect(200)
      .expect({ id: 1, title: 'NestJS Fundamentals', level: 'beginner' });

    await request(server).get('/courses/1').expect(404);
    await request(server).delete('/courses/1').expect(404);
  });

  it('/students (POST) registers a student and rejects a duplicate email', async () => {
    const server = app.getHttpServer();
    const student = {
      name: 'Ana Torres',
      email: 'ana.torres@example.com',
      age: 20,
      career: 'Software Engineering',
      semester: 3,
      isActive: true,
    };

    await request(server)
      .post('/students')
      .send(student)
      .expect(201)
      .expect({ id: 1, ...student });

    await request(server).post('/students').send(student).expect(409);
  });

  it('/students (GET) combines optional filters', async () => {
    const server = app.getHttpServer();
    const matchingStudent = {
      name: 'Ana Torres',
      email: 'ana.torres@example.com',
      age: 20,
      career: 'Software Engineering',
      semester: 3,
      isActive: true,
    };

    await request(server).post('/students').send(matchingStudent).expect(201);
    await request(server)
      .post('/students')
      .send({
        ...matchingStudent,
        email: 'luis.soto@example.com',
        career: 'Civil Engineering',
      })
      .expect(201);
    await request(server)
      .post('/students')
      .send({
        ...matchingStudent,
        email: 'maria.paz@example.com',
        semester: 4,
        isActive: false,
      })
      .expect(201);

    await request(server)
      .get('/students')
      .query({
        career: 'Software Engineering',
        semester: '3',
        isActive: 'true',
      })
      .expect(200)
      .expect([{ id: 1, ...matchingStudent }]);
  });

  it('/students/:id (PATCH) updates only supplied fields and rejects id changes', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/students')
      .send({
        name: 'Ana Torres',
        email: 'ana.torres@example.com',
        age: 20,
        career: 'Software Engineering',
        semester: 3,
        isActive: true,
      })
      .expect(201);

    await request(server)
      .patch('/students/1')
      .send({ career: 'Data Science', semester: 4 })
      .expect(200)
      .expect({
        id: 1,
        name: 'Ana Torres',
        email: 'ana.torres@example.com',
        age: 20,
        career: 'Data Science',
        semester: 4,
        isActive: true,
      });

    await request(server).patch('/students/1').send({ id: 2 }).expect(400);
  });

  it('/students/:id/status changes the active status and protects inactive students', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/students')
      .send({
        name: 'Ana Torres',
        email: 'ana.torres@example.com',
        age: 20,
        career: 'Software Engineering',
        semester: 3,
        isActive: true,
      })
      .expect(201);

    await request(server)
      .patch('/students/1/status')
      .send({ isActive: false })
      .expect(200);
    await request(server).delete('/students/1').expect(409);
    await request(server)
      .patch('/students/1/status')
      .send({ isActive: true })
      .expect(200);
    await request(server).delete('/students/1').expect(200);
  });

  it('/students/:id returns 400 for an invalid id and 404 for missing students', async () => {
    const server = app.getHttpServer();

    await request(server).get('/students/not-a-number').expect(400);
    await request(server).get('/students/999').expect(404);
    await request(server)
      .patch('/students/999')
      .send({ semester: 4 })
      .expect(404);
    await request(server).delete('/students/999').expect(404);
  });

  it('/students (POST) validates the allowed semester range', () => {
    return request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Ana Torres',
        email: 'ana.torres@example.com',
        age: 20,
        career: 'Software Engineering',
        semester: 11,
        isActive: true,
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
