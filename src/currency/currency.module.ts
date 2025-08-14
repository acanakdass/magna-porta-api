import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { CurrencySeedService } from './currency.seed';
import { CurrencyEntity } from '../entities/currency.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { CompanyCurrencyRateEntity } from '../entities/company-currency-rate.entity';
import { CompanyEntity } from '../company/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CurrencyEntity,
      CurrencyGroupEntity,
      CompanyCurrencyRateEntity,
      CompanyEntity
    ])
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService, CurrencySeedService],
  exports: [CurrencyService, CurrencySeedService]
})
export class CurrencyModule {}
