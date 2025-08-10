import type { INestApplication } from '@nestjs/common';

// Safe Swagger setup that doesn't fail build if @nestjs/swagger isn't installed.
export async function setupSwagger(app: INestApplication) {
  try {
    // Dynamically import to avoid hard dependency during compile in some environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swagger: any = require('@nestjs/swagger');
    const { DocumentBuilder, SwaggerModule } = swagger;

    const config = new DocumentBuilder()
      .setTitle('TrendLens API')
      .setDescription('API documentation for TrendLens backend')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document);
    // eslint-disable-next-line no-console
    console.log('[Swagger] UI available at /docs');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[Swagger] @nestjs/swagger not installed; docs disabled');
  }
}
