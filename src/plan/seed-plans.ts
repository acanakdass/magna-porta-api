#!/usr/bin/env node

/**
 * Script to seed plan data into the database
 * Run with: npx ts-node src/plan/seed-plans.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PlanSeedService } from './plan.seed';
import { PlanCurrencySeedService } from './plan-currency.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const planSeedService = app.get(PlanSeedService);
  const planCurrencySeedService = app.get(PlanCurrencySeedService);

  try {
    console.log('🌱 Starting plan seeding...');
    await planSeedService.seed();
    console.log('✅ Plan seeding completed successfully!');

    console.log('🌱 Starting plan currency rates seeding...');
    await planCurrencySeedService.seed();
    console.log('✅ Plan currency rates seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding plans or currency rates:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
