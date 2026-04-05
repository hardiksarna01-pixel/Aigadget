import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AIGadget API')
    .setDescription('AI-powered gadget review and comparison platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('products', 'Product CRUD and retrieval')
    .addTag('search', 'AI-powered search and recommendations')
    .addTag('comparisons', 'Product comparison engine')
    .addTag('ai', 'AI chat and recommendation endpoints')
    .addTag('scraper', 'Scraping pipeline management')
    .addTag('seo', 'Programmatic SEO page generation')
    .addTag('admin', 'Admin dashboard operations')
    .addTag('affiliates', 'Affiliate click tracking')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`AIGadget API running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
