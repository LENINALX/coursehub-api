import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureCors } from './cors.js';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

describe('CORS configuration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureCors(app, 'http://localhost:5173, https://coursehub.example.edu');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows configured origins and omits the header for other origins', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );

    const denied = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects wildcard and non-origin CORS configuration', () => {
    expect(() => configureCors(app, '*')).toThrow('Invalid CORS origin');
    expect(() => configureCors(app, 'https://example.edu/path')).toThrow(
      'Invalid CORS origin',
    );
  });
});
