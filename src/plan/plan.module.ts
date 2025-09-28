import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './plan.service';
import { PlanController, CompanyPlanController } from './plan.controller';
import { PlanCurrencyController } from './plan-currency.controller';
import { PlanCurrencyService } from './plan-currency.service';
import { PlanEntity } from './plan.entity';
import { CompanyEntity } from '../company/company.entity';
import { PlanCurrencyRateEntity } from '../entities/plan-currency-rate.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { PlanSeedService } from './plan.seed';
import { PlanCurrencySeedService } from './plan-currency.seed';

@Module({
  imports: [TypeOrmModule.forFeature([
    PlanEntity, 
    CompanyEntity, 
    PlanCurrencyRateEntity, 
    CurrencyGroupEntity
  ])],
  controllers: [PlanController, CompanyPlanController, PlanCurrencyController],
  providers: [PlanService, PlanCurrencyService, PlanSeedService, PlanCurrencySeedService],
  exports: [PlanService, PlanCurrencyService, PlanSeedService, PlanCurrencySeedService],
})
export class PlanModule {}
