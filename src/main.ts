import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, VersioningType } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as morgan from 'morgan';
import * as cookieParser from 'cookie-parser';

import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set Global Prefix
  app.setGlobalPrefix('api', {
    exclude: ['/', 'health', 'healthcheck', 'kaithheathcheck'],
  });
  
  // Enable CORS
  const allowedOrigins = [
    'http://localhost:5173',
    'https://insighta-web.netlify.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-XSRF-TOKEN',
  });

  // Enable URI Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Request Logging
  app.use(morgan('dev'));

  // Cookie Parser
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    exceptionFactory: (errors) => {
      return new BadRequestException(
        errors.map(err => {
          if (err.constraints) {
             return Object.values(err.constraints).join(', ');
          }
          return 'Invalid parameter';
        })
      );
    }
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
