import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import * as process from "node:process";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Static files serve et
  app.useStaticAssets(join(__dirname, '..', 'src', 'assets'), {
    prefix: '/assets/',
  });

  // CORS ayarları
  app.enableCors({
    origin: [
      'https://app.magna-porta.com',
      'https://app.magna-porta.com/',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Sunucu port'unu al
  const port = process.env.PORT || 3001;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;

  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('API for user login/register and external services')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(serverUrl, 'Development server')
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('http://localhost:3000', 'Default Local')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`🚀 Application is running on: ${serverUrl}`);
  console.log(`📚 Swagger documentation available at: ${serverUrl}/api`);
}
bootstrap();