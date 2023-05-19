import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3050);
}
bootstrap();
