import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { CoursesModule } from './courses/courses.module.js';
import { Course } from './courses/entities/course.entity.js';
import { Enrollment } from './enrollments/entiti/enrollment.entity.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { Student } from './students/entities/student.entity.js';
import { StudentsModule } from './students/students.module.js';
import { AuthModule } from './auth/auth.module.js';
import { User } from './users/entities/user.entity.js';
import { UsersModule } from './users/users.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { HttpErrorFilter } from './common/filters/http-error.filter.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor.js';
import { CoursesController } from './courses/courses.controller.js';
import { EnrollmentsController } from './enrollments/enrollments.controller.js';
import { StudentsController } from './students/students.controller.js';
import { WelcomeController } from './welcome.controller.js';
import { AppService } from './app.service.js';
import { WelcomeService } from './welcome.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(3001),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().port().default(5432),
        DATABASE_NAME: Joi.string().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().allow('').required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string()
          .pattern(/^\d+[smhd]$/)
          .default('15m'),
        CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DATABASE_HOST'),
        port: config.getOrThrow<number>('DATABASE_PORT'),
        username: config.getOrThrow('DATABASE_USER'),
        password: config.getOrThrow('DATABASE_PASSWORD'),
        database: config.getOrThrow('DATABASE_NAME'),
        entities: [Course, Student, Enrollment, User],
        synchronize: config.getOrThrow<string>('NODE_ENV') === 'development',
      }),
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController, WelcomeController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestTimingInterceptor },
    RequestLoggerMiddleware,
    AppService,
    WelcomeService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes(
        AppController,
        AuthController,
        CoursesController,
        EnrollmentsController,
        StudentsController,
        WelcomeController,
      );
  }
}
