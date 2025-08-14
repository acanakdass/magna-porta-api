import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyEntity } from '../entities/currency.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { CompanyCurrencyRateEntity } from '../entities/company-currency-rate.entity';
import { CompanyEntity } from '../company/company.entity';
import { CreateCurrencyDto, CreateCurrencyGroupDto, CreateCompanyRateDto } from './dtos';
import { BaseApiResponse } from '../common/dto/api-response-dto';

@Injectable()
export class CurrencyService {
    constructor(
        @InjectRepository(CurrencyEntity)
        private currencyRepository: Repository<CurrencyEntity>,
        
        @InjectRepository(CurrencyGroupEntity)
        private currencyGroupRepository: Repository<CurrencyGroupEntity>,
        
        @InjectRepository(CompanyCurrencyRateEntity)
        private companyRateRepository: Repository<CompanyCurrencyRateEntity>,

        @InjectRepository(CompanyEntity)
        private companyRepository: Repository<CompanyEntity>
    ) {}

    // Currency Group Methods
    async createCurrencyGroup(createDto: CreateCurrencyGroupDto): Promise<BaseApiResponse<CurrencyGroupEntity>> {
        try {
            const existingGroup = await this.currencyGroupRepository.findOne({
                where: { name: createDto.name }
            });

            if (existingGroup) {
                throw new ConflictException('Currency group with this name already exists');
            }

            const group = this.currencyGroupRepository.create(createDto);
            const savedGroup = await this.currencyGroupRepository.save(group);

            return {
                success: true,
                data: savedGroup,
                message: 'Currency group created successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to create currency group: ${error.message}`
            };
        }
    }

    async getAllCurrencyGroups(): Promise<BaseApiResponse<CurrencyGroupEntity[]>> {
        try {
            const groups = await this.currencyGroupRepository.find({
                where: { isActive: true },
                relations: ['currencies']
            });

            return {
                success: true,
                data: groups,
                message: 'Currency groups retrieved successfully'
            };
        } catch (error) {
            console.error('Error in getAllCurrencyGroups:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve currency groups: ${error.message}`
            };
        }
    }

    // Currency Methods
    async createCurrency(createDto: CreateCurrencyDto): Promise<BaseApiResponse<CurrencyEntity>> {
        try {
            // Check if group exists
            const group = await this.currencyGroupRepository.findOne({
                where: { id: createDto.groupId }
            });

            if (!group) {
                throw new NotFoundException('Currency group not found');
            }

            // Check if currency code already exists
            const existingCurrency = await this.currencyRepository.findOne({
                where: { code: createDto.code }
            });

            if (existingCurrency) {
                throw new ConflictException('Currency with this code already exists');
            }

            const currency = this.currencyRepository.create(createDto);
            const savedCurrency = await this.currencyRepository.save(currency);

            return {
                success: true,
                data: savedCurrency,
                message: 'Currency created successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to create currency: ${error.message}`
            };
        }
    }

    async getAllCurrencies(): Promise<BaseApiResponse<CurrencyEntity[]>> {
        try {
            const currencies = await this.currencyRepository.find({
                where: { isActive: true },
                order: { code: 'ASC' }
            });

            return {
                success: true,
                data: currencies,
                message: 'Currencies retrieved successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to retrieve currencies: ${error.message}`
            };
        }
    }

    async getCurrenciesByGroup(groupId: number): Promise<BaseApiResponse<CurrencyEntity[]>> {
        try {
            const currencies = await this.currencyRepository.find({
                where: { groupId, isActive: true },
                order: { code: 'ASC' }
            });

            return {
                success: true,
                data: currencies,
                message: 'Currencies retrieved successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to retrieve currencies: ${error.message}`
            };
        }
    }

    // Company Rate Methods
    async createCompanyRate(createDto: CreateCompanyRateDto): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        try {
            // Check if company exists (you might want to inject CompanyService here)
            // Check if group exists
            const group = await this.currencyGroupRepository.findOne({
                where: { id: createDto.groupId }
            });

            if (!group) {
                throw new NotFoundException('Currency group not found');
            }

            // Check if rate already exists for this company and group
            const existingRate = await this.companyRateRepository.findOne({
                where: { companyId: createDto.companyId, groupId: createDto.groupId }
            });

            if (existingRate) {
                throw new ConflictException('Rate already exists for this company and group');
            }

            const rate = this.companyRateRepository.create(createDto);
            const savedRate = await this.companyRateRepository.save(rate);

            return {
                success: true,
                data: savedRate,
                message: 'Company rate created successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to create company rate: ${error.message}`
            };
        }
    }

    async getCompanyRates(companyId: number): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        try {
            const rates = await this.companyRateRepository.find({
                where: { companyId, isActive: true },
                relations: ['currencyGroup'],
                order: { groupId: 'ASC' }
            });

            return {
                success: true,
                data: rates,
                message: 'Company rates retrieved successfully'
            };
        } catch (error) {
            console.error('Error in getCompanyRates:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve company rates: ${error.message}`
            };
        }
    }

    async getCompanyRateForGroup(companyId: number, groupId: number): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        try {
            const rate = await this.companyRateRepository.findOne({
                where: { companyId, groupId, isActive: true },
                relations: ['currencyGroup']
            });

            if (!rate) {
                throw new NotFoundException('Rate not found for this company and group');
            }

            return {
                success: true,
                data: rate,
                message: 'Company rate retrieved successfully'
            };
        } catch (error) {
            console.error('Error in getCompanyRateForGroup:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve company rate: ${error.message}`
            };
        }
    }

    // Utility method to get conversion rate for specific currencies
    async getConversionRate(companyId: number, fromCurrency: string, toCurrency: string): Promise<BaseApiResponse<{ rate: number; feePercentage: number }>> {
        try {
            // Find currencies and their groups
            const fromCurrencyEntity = await this.currencyRepository.findOne({
                where: { code: fromCurrency, isActive: true }
            });

            const toCurrencyEntity = await this.currencyRepository.findOne({
                where: { code: toCurrency, isActive: true }
            });

            if (!fromCurrencyEntity || !toCurrencyEntity) {
                throw new NotFoundException('One or both currencies not found');
            }

            // If currencies are in the same group, get the group rate
            if (fromCurrencyEntity.groupId === toCurrencyEntity.groupId) {
                const groupRate = await this.companyRateRepository.findOne({
                    where: { companyId, groupId: fromCurrencyEntity.groupId, isActive: true }
                });

                if (!groupRate) {
                    throw new NotFoundException('No rate found for this currency group');
                }

                return {
                    success: true,
                    data: {
                        rate: groupRate.conversionRate,
                        feePercentage: groupRate.feePercentage || 0
                    },
                    message: 'Conversion rate retrieved successfully'
                };
            }

            // Cross-group conversion: Get rates for both groups and use the higher one
            const fromGroupRate = await this.companyRateRepository.findOne({
                where: { companyId, groupId: fromCurrencyEntity.groupId, isActive: true }
            });

            const toGroupRate = await this.companyRateRepository.findOne({
                where: { companyId, groupId: toCurrencyEntity.groupId, isActive: true }
            });

            if (!fromGroupRate || !toGroupRate) {
                throw new NotFoundException('No rate found for one or both currency groups');
            }

            // Use the higher conversion rate between the two groups
            const selectedRate = fromGroupRate.conversionRate > toGroupRate.conversionRate 
                ? fromGroupRate 
                : toGroupRate;

            return {
                success: true,
                data: {
                    rate: selectedRate.conversionRate,
                    feePercentage: selectedRate.feePercentage || 0
                },
                message: `Cross-group conversion: Using rate from group ${selectedRate.groupId} (higher rate)`
            };
        } catch (error) {
            console.error('Error in getConversionRate:', error);
            return {
                success: false,
                data: null,
                message: `Failed to get conversion rate: ${error.message}`
            };
        }
    }

    // New method: Get conversion rate by airwallex_account_id
    async getConversionRateByAirwallexAccount(
        airwallexAccountId: string, 
        fromCurrency: string, 
        toCurrency: string
    ): Promise<BaseApiResponse<{ 
        rate: number; 
        feePercentage: number; 
        companyId: number; 
        companyName: string;
        groupName: string;
        isCrossGroup: boolean;
        selectedGroupId: number;
    }>> {
        try {
            // First, find the company by airwallex_account_id
            const company = await this.companyRepository.findOne({
                where: { airwallex_account_id: airwallexAccountId, isActive: true }
            });

            if (!company) {
                throw new NotFoundException(`Company with airwallex_account_id ${airwallexAccountId} not found`);
            }

            // Find currencies and their groups
            const fromCurrencyEntity = await this.currencyRepository.findOne({
                where: { code: fromCurrency, isActive: true }
            });

            const toCurrencyEntity = await this.currencyRepository.findOne({
                where: { code: toCurrency, isActive: true }
            });

            if (!fromCurrencyEntity || !toCurrencyEntity) {
                throw new NotFoundException('One or both currencies not found');
            }

            // If currencies are in the same group, get the group rate
            if (fromCurrencyEntity.groupId === toCurrencyEntity.groupId) {
                const groupRate = await this.companyRateRepository.findOne({
                    where: { companyId: company.id, groupId: fromCurrencyEntity.groupId, isActive: true },
                    relations: ['currencyGroup']
                });

                if (!groupRate) {
                    throw new NotFoundException(`No rate found for company ${company.name} and currency group`);
                }

                return {
                    success: true,
                    data: {
                        rate: groupRate.conversionRate,
                        feePercentage: groupRate.feePercentage || 0,
                        companyId: company.id,
                        companyName: company.name,
                        groupName: groupRate.currencyGroup.name,
                        isCrossGroup: false,
                        selectedGroupId: fromCurrencyEntity.groupId
                    },
                    message: 'Conversion rate retrieved successfully (same group)'
                };
            }

            // Cross-group conversion: Get rates for both groups and use the higher one
            const fromGroupRate = await this.companyRateRepository.findOne({
                where: { companyId: company.id, groupId: fromCurrencyEntity.groupId, isActive: true },
                relations: ['currencyGroup']
            });

            const toGroupRate = await this.companyRateRepository.findOne({
                where: { companyId: company.id, groupId: toCurrencyEntity.groupId, isActive: true },
                relations: ['currencyGroup']
            });

            if (!fromGroupRate || !toGroupRate) {
                throw new NotFoundException(`No rate found for company ${company.name} in one or both currency groups`);
            }

            // Use the higher conversion rate between the two groups
            const selectedRate = fromGroupRate.conversionRate > toGroupRate.conversionRate 
                ? fromGroupRate 
                : toGroupRate;

            return {
                success: true,
                data: {
                    rate: selectedRate.conversionRate,
                    feePercentage: selectedRate.feePercentage || 0,
                    companyId: company.id,
                    companyName: company.name,
                    groupName: selectedRate.currencyGroup.name,
                    isCrossGroup: true,
                    selectedGroupId: selectedRate.groupId
                },
                message: `Cross-group conversion: Using rate from group ${selectedRate.currencyGroup.name} (higher rate: ${selectedRate.conversionRate})`
            };
        } catch (error) {
            console.error('Error in getConversionRateByAirwallexAccount:', error);
            return {
                success: false,
                data: null,
                message: `Failed to get conversion rate: ${error.message}`
            };
        }
    }
}
