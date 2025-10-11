import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferMarkupRatesController } from './transfer-markup-rates.controller';
import { TransferMarkupRatesService } from './transfer-markup-rates.service';
import { TransferMarkupRateEntity } from '../entities/transfer-markup-rate.entity';
import { PlanEntity } from '../plan/plan.entity';
import { CompanyEntity } from '../company/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransferMarkupRateEntity, PlanEntity, CompanyEntity])],
  controllers: [TransferMarkupRatesController],
  providers: [TransferMarkupRatesService],
  exports: [TransferMarkupRatesService],
})
export class TransferMarkupRatesModule {}
