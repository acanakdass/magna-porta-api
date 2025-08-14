import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyEntity } from '../entities/currency.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { CompanyCurrencyRateEntity } from '../entities/company-currency-rate.entity';

@Injectable()
export class CurrencySeedService {
    constructor(
        @InjectRepository(CurrencyGroupEntity)
        private currencyGroupRepository: Repository<CurrencyGroupEntity>,
        
        @InjectRepository(CurrencyEntity)
        private currencyRepository: Repository<CurrencyEntity>,
        
        @InjectRepository(CompanyCurrencyRateEntity)
        private companyRateRepository: Repository<CompanyCurrencyRateEntity>
    ) {}

    async seed() {
        console.log('Starting currency seed...');

        // Create currency groups
        const group1 = await this.createCurrencyGroup({
            name: 'Major Currencies',
            description: 'Major world currencies like EUR, USD, GBP',
            isActive: true
        });

        const group2 = await this.createCurrencyGroup({
            name: 'Emerging Markets',
            description: 'Emerging market currencies like TRY, BRL, INR',
            isActive: true
        });

        const group3 = await this.createCurrencyGroup({
            name: 'Asian Currencies',
            description: 'Asian currencies like JPY, CNY, KRW',
            isActive: true
        });

        // Create currencies
        await this.createCurrency({
            code: 'EUR',
            name: 'Euro',
            symbol: '€',
            groupId: group1.id,
            isActive: true
        });

        await this.createCurrency({
            code: 'USD',
            name: 'US Dollar',
            symbol: '$',
            groupId: group1.id,
            isActive: true
        });

        await this.createCurrency({
            code: 'GBP',
            name: 'British Pound',
            symbol: '£',
            groupId: group1.id,
            isActive: true
        });

        await this.createCurrency({
            code: 'TRY',
            name: 'Turkish Lira',
            symbol: '₺',
            groupId: group2.id,
            isActive: true
        });

        await this.createCurrency({
            code: 'BRL',
            name: 'Brazilian Real',
            symbol: 'R$',
            groupId: group2.id,
            isActive: true
        });

        await this.createCurrency({
            code: 'JPY',
            name: 'Japanese Yen',
            symbol: '¥',
            groupId: group3.id,
            isActive: true
        });

        await this.createCurrency({
            code: 'CNY',
            name: 'Chinese Yuan',
            symbol: '¥',
            groupId: group3.id,
            isActive: true
        });

        console.log('Currency seed completed!');
    }

    private async createCurrencyGroup(data: Partial<CurrencyGroupEntity>): Promise<CurrencyGroupEntity> {
        const existing = await this.currencyGroupRepository.findOne({
            where: { name: data.name }
        });

        if (existing) {
            return existing;
        }

        const group = this.currencyGroupRepository.create(data);
        return await this.currencyGroupRepository.save(group);
    }

    private async createCurrency(data: Partial<CurrencyEntity>): Promise<CurrencyEntity> {
        const existing = await this.currencyRepository.findOne({
            where: { code: data.code }
        });

        if (existing) {
            return existing;
        }

        const currency = this.currencyRepository.create(data);
        return await this.currencyRepository.save(currency);
    }

    // Example method to create company rates (you can call this after creating companies)
    async createExampleCompanyRates(companyId1: number, companyId2: number) {
        // Company 1 rates
        await this.createCompanyRate({
            companyId: companyId1,
            groupId: 1, // Major Currencies
            conversionRate: 0.5,
            feePercentage: 1.5,
            isActive: true,
            notes: 'Premium rate for Company A'
        });

        await this.createCompanyRate({
            companyId: companyId1,
            groupId: 2, // Emerging Markets
            conversionRate: 0.6,
            feePercentage: 2.0,
            isActive: true,
            notes: 'Standard rate for Company A'
        });

        // Company 2 rates
        await this.createCompanyRate({
            companyId: companyId2,
            groupId: 1, // Major Currencies
            conversionRate: 0.75,
            feePercentage: 1.0,
            isActive: true,
            notes: 'Standard rate for Company B'
        });

        await this.createCompanyRate({
            companyId: companyId2,
            groupId: 2, // Emerging Markets
            conversionRate: 0.8,
            feePercentage: 1.5,
            isActive: true,
            notes: 'Premium rate for Company B'
        });

        console.log('Example company rates created!');
    }

    private async createCompanyRate(data: Partial<CompanyCurrencyRateEntity>): Promise<CompanyCurrencyRateEntity> {
        const existing = await this.companyRateRepository.findOne({
            where: { companyId: data.companyId, groupId: data.groupId }
        });

        if (existing) {
            return existing;
        }

        const rate = this.companyRateRepository.create(data);
        return await this.companyRateRepository.save(rate);
    }
}
