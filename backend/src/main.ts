import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global auth guard (except /health and /auth/login handled inside guard)
  app.useGlobalGuards(new AuthGuard());

  // Swagger (if @nestjs/swagger is installed)
  await setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
