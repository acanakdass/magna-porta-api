import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './plan.service';
import { PlanTypeService } from './plan-type.service';
import { PlanController, CompanyPlanController } from './plan.controller';
import { PlanTypeController } from './plan-type.controller';
import { PlanCurrencyController } from './plan-currency.controller';
import { PlanCurrencyService } from './plan-currency.service';
import { PlanEntity } from './plan.entity';
import { PlanTypeEntity } from './plan-type.entity';
import { CompanyEntity } from '../company/company.entity';
import { PlanCurrencyRateEntity } from '../entities/plan-currency-rate.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { PlanSeedService } from './plan.seed';
import { PlanTypeSeedService } from './plan-type.seed';
import { PlanCurrencySeedService } from './plan-currency.seed';

@Module({
  imports: [TypeOrmModule.forFeature([
    PlanEntity,
    PlanTypeEntity,
    CompanyEntity, 
    PlanCurrencyRateEntity, 
    CurrencyGroupEntity
  ])],
  controllers: [PlanController, PlanTypeController, CompanyPlanController, PlanCurrencyController],
  providers: [PlanService, PlanTypeService, PlanCurrencyService, PlanSeedService, PlanTypeSeedService, PlanCurrencySeedService],
  exports: [PlanService, PlanTypeService, PlanCurrencyService, PlanSeedService, PlanTypeSeedService, PlanCurrencySeedService],
})
export class PlanModule {}
