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

  afterEach(async () => {
    await app.close();
  });
});
