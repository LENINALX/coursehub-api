import type { INestApplication } from '@nestjs/common';

export function configureCors(
  app: Pick<INestApplication, 'enableCors'>,
  configuredOrigins: string,
) {
  const origins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
    if (
      origin === '*' ||
      !['http:', 'https:'].includes(parsedOrigin.protocol) ||
      parsedOrigin.origin !== origin
    ) {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  }

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
