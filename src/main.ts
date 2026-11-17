import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureCors } from './config/cors.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = app.get(ConfigService);
  const configuredOrigins = process.env.CORS_ORIGINS;
  if (
    config.getOrThrow<string>('NODE_ENV') === 'production' &&
    !configuredOrigins
  ) {
    throw new Error('CORS_ORIGINS must be configured in production');
  }
  configureCors(
    app,
    configuredOrigins ?? config.getOrThrow<string>('CORS_ORIGINS'),
  );
  await app.listen(config.getOrThrow<number>('PORT'));
}
bootstrap();
