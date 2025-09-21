import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CurrencyEntity } from '../entities/currency.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { CompanyCurrencyRateEntity } from '../entities/company-currency-rate.entity';
import { CompanyEntity } from '../company/company.entity';
import {
    CreateCurrencyDto,
    CreateCurrencyGroupDto,
    CreateCompanyRateDto,
    AssignCurrencyGroupDto,
    BulkCompanyRateDto,
    RateTemplateDto,
    UpdateCurrencyGroupDto,
    UpdateCompanyRateDto,
    UpdateCurrencyDto
} from './dtos';
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
                message: 'Currency group created successfully',
                loading: false
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to create currency group: ${error.message}`,
                loading: false
            };
        }
    }

    async getAllCurrencyGroups(): Promise<BaseApiResponse<CurrencyGroupEntity[]>> {
        try {
            const groups = await this.currencyGroupRepository.find({
                where: { isActive: true }
            });

            return {
                success: true,
                data: groups,
                message: 'Currency groups retrieved successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in getAllCurrencyGroups:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve currency groups: ${error.message}`,
                loading: false
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
                message: 'Currency created successfully',
                loading: false
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to create currency: ${error.message}`,
                loading: false
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
                message: 'Currencies retrieved successfully',
                loading: false
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to retrieve currencies: ${error.message}`,
                loading: false
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
                message: 'Currencies retrieved successfully',
                loading: false
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to retrieve currencies: ${error.message}`,
                loading: false
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
                message: 'Company rate created successfully',
                loading: false
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to create company rate: ${error.message}`,
                loading: false
            };
        }
    }

    async getCompanyRates(companyId: number): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        try {
            const rates = await this.companyRateRepository.find({
                where: { companyId, isActive: true },
                relations: ['company'],
                order: { groupId: 'ASC' }
            });

            return {
                success: true,
                data: rates,
                message: 'Company rates retrieved successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in getCompanyRates:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve company rates: ${error.message}`,
                loading: false
            };
        }
    }

    async getCompanyRateForGroup(companyId: number, groupId: number): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        try {
            const rate = await this.companyRateRepository.findOne({
                where: { companyId, groupId, isActive: true },
                relations: ['company']
            });

            if (!rate) {
                throw new NotFoundException('Rate not found for this company and group');
            }

            return {
                success: true,
                data: rate,
                message: 'Company rate retrieved successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in getCompanyRateForGroup:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve company rate: ${error.message}`,
                loading: false
            };
        }
    }

    // Utility method to get conversion rate for specific currencies
    async getConversionRate(companyId: number, fromCurrency: string, toCurrency: string): Promise<BaseApiResponse<{ rate: number; awRate: number; mpRate: number }>> {
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
                        awRate: groupRate.awRate || 2,
                        mpRate: groupRate.mpRate
                    },
                    message: 'Conversion rate retrieved successfully',
                    loading: false
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
                    awRate: selectedRate.awRate || 2,
                    mpRate: selectedRate.mpRate
                },
                message: `Cross-group conversion: Using rate from group ${selectedRate.groupId} (higher rate)`,
                loading: false
            };
        } catch (error) {
            console.error('Error in getConversionRate:', error);
            return {
                success: false,
                data: null,
                message: `Failed to get conversion rate: ${error.message}`,
                loading: false
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
        awRate: number; 
        mpRate: number; 
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
                    where: { companyId: company.id, groupId: fromCurrencyEntity.groupId, isActive: true }
                });

                if (!groupRate) {
                    throw new NotFoundException(`No rate found for company ${company.name} and currency group`);
                }

                // Get currency group name
                const currencyGroup = await this.currencyGroupRepository.findOne({
                    where: { id: fromCurrencyEntity.groupId }
                });

                return {
                    success: true,
                    data: {
                        rate: groupRate.conversionRate,
                        awRate: groupRate.awRate || 2,
                        mpRate: groupRate.mpRate,
                        companyId: company.id,
                        companyName: company.name,
                        groupName: currencyGroup?.name || 'Unknown Group',
                        isCrossGroup: false,
                        selectedGroupId: fromCurrencyEntity.groupId
                    },
                    message: 'Conversion rate retrieved successfully (same group)',
                    loading: false
                };
            }

            // Cross-group conversion: Get rates for both groups and use the higher one
            const fromGroupRate = await this.companyRateRepository.findOne({
                where: { companyId: company.id, groupId: fromCurrencyEntity.groupId, isActive: true }
            });

            const toGroupRate = await this.companyRateRepository.findOne({
                where: { companyId: company.id, groupId: toCurrencyEntity.groupId, isActive: true }
            });

            if (!fromGroupRate || !toGroupRate) {
                throw new NotFoundException(`No rate found for company ${company.name} in one or both currency groups`);
            }

            // Use the higher conversion rate between the two groups
            const selectedRate = fromGroupRate.conversionRate > toGroupRate.conversionRate 
                ? fromGroupRate 
                : toGroupRate;

            // Get currency group name for selected rate
            const selectedCurrencyGroup = await this.currencyGroupRepository.findOne({
                where: { id: selectedRate.groupId }
            });

            return {
                success: true,
                data: {
                    rate: selectedRate.conversionRate,
                    awRate: selectedRate.awRate || 2,
                    mpRate: selectedRate.mpRate,
                    companyId: company.id,
                    companyName: company.name,
                    groupName: selectedCurrencyGroup?.name || 'Unknown Group',
                    isCrossGroup: true,
                    selectedGroupId: selectedRate.groupId
                },
                message: `Cross-group conversion: Using rate from group ${selectedCurrencyGroup?.name || 'Unknown Group'} (higher rate: ${selectedRate.conversionRate})`,
                loading: false
            };
        } catch (error) {
            console.error('Error in getConversionRateByAirwallexAccount:', error);
            return {
                success: false,
                data: null,
                message: `Failed to get conversion rate: ${error.message}`,
                loading: false
            };
        }
    }

    async updateCurrencyGroup(groupId: number, updateDto: UpdateCurrencyGroupDto): Promise<BaseApiResponse<CurrencyGroupEntity>> {
        try {
            // Check if group exists
            const group = await this.currencyGroupRepository.findOne({
                where: { id: groupId }
            });

            if (!group) {
                throw new NotFoundException('Currency group not found');
            }

            // Update group information
            group.name = updateDto.name;
            if (updateDto.description !== undefined) {
                group.description = updateDto.description;
            }
            if (updateDto.isActive !== undefined) {
                group.isActive = updateDto.isActive;
            }

            // Save updated group
            const updatedGroup = await this.currencyGroupRepository.save(group);

            // Get current currencies in this group
            const currentCurrencies = await this.currencyRepository.find({
                where: { groupId: groupId }
            });

            // Remove currencies that are not in the new selection
            const currentCurrencyIds = currentCurrencies.map(c => c.id);
            const currenciesToRemove = currentCurrencyIds.filter(id => !updateDto.selectedCurrencies.includes(id));
            
            // Find or create a default group for unassigned currencies
            let defaultGroup = await this.currencyGroupRepository.findOne({
                where: { name: 'Unassigned Currencies' }
            });
            
            if (!defaultGroup) {
                defaultGroup = await this.currencyGroupRepository.save({
                    name: 'Unassigned Currencies',
                    description: 'Currencies not assigned to any specific group',
                    isActive: true
                });
            }
            
            // Move removed currencies to default group
            for (const currencyId of currenciesToRemove) {
                const currency = await this.currencyRepository.findOne({
                    where: { id: currencyId }
                });
                if (currency) {
                    currency.groupId = defaultGroup.id;
                    await this.currencyRepository.save(currency);
                }
            }

            // Add selected currencies to this group
            for (const currencyId of updateDto.selectedCurrencies) {
                const currency = await this.currencyRepository.findOne({
                    where: { id: currencyId, isActive: true }
                });

                if (currency) {
                    currency.groupId = groupId;
                    await this.currencyRepository.save(currency);
                }
            }

            // Get updated group with currencies
            const finalGroup = await this.currencyGroupRepository.findOne({
                where: { id: groupId },
                relations: ['currencies']
            });

            return {
                success: true,
                data: finalGroup,
                message: 'Currency group updated successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in updateCurrencyGroup:', error);
            return {
                success: false,
                data: null,
                message: `Failed to update currency group: ${error.message}`,
                loading: false
            };
        }
    }

    async updateCompanyRate(rateId: number, updateDto: UpdateCompanyRateDto): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        try {
            // Check if rate exists
            const existingRate = await this.companyRateRepository.findOne({
                where: { id: rateId }
            });

            if (!existingRate) {
                throw new NotFoundException('Company rate not found');
            }

            // Check if company exists
            const company = await this.companyRepository.findOne({
                where: { id: updateDto.companyId, isActive: true }
            });

            if (!company) {
                throw new NotFoundException('Company not found');
            }

            // Check if group exists
            const group = await this.currencyGroupRepository.findOne({
                where: { id: updateDto.groupId, isActive: true }
            });

            if (!group) {
                throw new NotFoundException('Currency group not found');
            }

            // Check if another rate already exists for this company and group (excluding current rate)
            const duplicateRate = await this.companyRateRepository.findOne({
                where: { 
                    companyId: updateDto.companyId, 
                    groupId: updateDto.groupId,
                    id: Not(rateId)
                }
            });

            if (duplicateRate) {
                throw new ConflictException('Rate already exists for this company and group');
            }

            // Calculate conversion rate: awRate + mpRate
            const awRate = updateDto.awRate !== undefined ? updateDto.awRate : (existingRate.awRate || 2);
            const mpRate = updateDto.mpRate !== undefined ? updateDto.mpRate : (existingRate.mpRate || 0);
            const conversionRate = awRate + mpRate;

            // Update rate
            existingRate.companyId = updateDto.companyId;
            existingRate.groupId = updateDto.groupId;
            existingRate.conversionRate = conversionRate;
            existingRate.awRate = awRate;
            existingRate.mpRate = updateDto.mpRate;
            existingRate.isActive = updateDto.isActive !== undefined ? updateDto.isActive : existingRate.isActive;
            existingRate.notes = updateDto.notes;

            const updatedRate = await this.companyRateRepository.save(existingRate);

            // Get updated rate with company details
            const finalRate = await this.companyRateRepository.findOne({
                where: { id: rateId },
                relations: ['company']
            });

            return {
                success: true,
                data: finalRate,
                message: 'Company rate updated successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in updateCompanyRate:', error);
            return {
                success: false,
                data: null,
                message: `Failed to update company rate: ${error.message}`,
                loading: false
            };
        }
    }

    async deleteCompanyRate(rateId: number): Promise<BaseApiResponse<null>> {
        try {
            // Check if rate exists
            const existingRate = await this.companyRateRepository.findOne({
                where: { id: rateId }
            });

            if (!existingRate) {
                throw new NotFoundException('Company rate not found');
            }

            // Delete the rate
            await this.companyRateRepository.remove(existingRate);

            return {
                success: true,
                data: null,
                message: 'Company rate deleted successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in deleteCompanyRate:', error);
            return {
                success: false,
                data: null,
                message: `Failed to delete company rate: ${error.message}`,
                loading: false
            };
        }
    }

    async updateCurrency(currencyId: number, updateDto: UpdateCurrencyDto): Promise<BaseApiResponse<CurrencyEntity>> {
        try {
            // Check if currency exists
            const existingCurrency = await this.currencyRepository.findOne({
                where: { id: currencyId }
            });

            if (!existingCurrency) {
                throw new NotFoundException('Currency not found');
            }

            // Check if currency group exists
            const currencyGroup = await this.currencyGroupRepository.findOne({
                where: { id: updateDto.groupId }
            });

            if (!currencyGroup) {
                throw new NotFoundException('Currency group not found');
            }

            // Check if code is already used by another currency
            const duplicateCurrency = await this.currencyRepository.findOne({
                where: { 
                    code: updateDto.code,
                    id: Not(currencyId)
                }
            });

            if (duplicateCurrency) {
                throw new ConflictException('Currency code already exists');
            }

            // Update currency
            existingCurrency.code = updateDto.code;
            existingCurrency.name = updateDto.name;
            existingCurrency.symbol = updateDto.symbol;
            existingCurrency.groupId = updateDto.groupId;
            existingCurrency.isActive = updateDto.isActive !== undefined ? updateDto.isActive : existingCurrency.isActive;

            const updatedCurrency = await this.currencyRepository.save(existingCurrency);

            return {
                success: true,
                data: updatedCurrency,
                message: 'Currency updated successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in updateCurrency:', error);
            return {
                success: false,
                data: null,
                message: `Failed to update currency: ${error.message}`,
                loading: false
            };
        }
    }

    async deleteCurrency(currencyId: number): Promise<BaseApiResponse<null>> {
        try {
            // Check if currency exists
            const existingCurrency = await this.currencyRepository.findOne({
                where: { id: currencyId }
            });

            if (!existingCurrency) {
                throw new NotFoundException('Currency not found');
            }

            // Check if currency is used in any company rates
            const companyRates = await this.companyRateRepository.find({
                where: { 
                    groupId: existingCurrency.groupId,
                    isActive: true
                }
            });

            if (companyRates.length > 0) {
                throw new ConflictException('Cannot delete currency that is used in company rates');
            }

            // Delete the currency
            await this.currencyRepository.remove(existingCurrency);

            return {
                success: true,
                data: null,
                message: 'Currency deleted successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in deleteCurrency:', error);
            return {
                success: false,
                data: null,
                message: `Failed to delete currency: ${error.message}`,
                loading: false
            };
        }
    }

    // Currency Group Assignment Methods
    async assignCurrencyToGroup(currencyId: number, assignDto: AssignCurrencyGroupDto): Promise<BaseApiResponse<CurrencyEntity>> {
        try {
            // Check if currency exists
            const currency = await this.currencyRepository.findOne({
                where: { id: currencyId, isActive: true }
            });

            if (!currency) {
                throw new NotFoundException('Currency not found');
            }

            // Check if group exists
            const group = await this.currencyGroupRepository.findOne({
                where: { id: assignDto.groupId, isActive: true }
            });

            if (!group) {
                throw new NotFoundException('Currency group not found');
            }

            // Update currency group
            currency.groupId = assignDto.groupId;
            const updatedCurrency = await this.currencyRepository.save(currency);

            return {
                success: true,
                data: updatedCurrency,
                message: 'Currency assigned to group successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in assignCurrencyToGroup:', error);
            return {
                success: false,
                data: null,
                message: `Failed to assign currency to group: ${error.message}`,
                loading: false
            };
        }
    }

    async removeCurrencyFromGroup(currencyId: number): Promise<BaseApiResponse<CurrencyEntity>> {
        try {
            // Check if currency exists
            const currency = await this.currencyRepository.findOne({
                where: { id: currencyId, isActive: true }
            });

            if (!currency) {
                throw new NotFoundException('Currency not found');
            }

            // Set groupId to null or 0 (depending on your business logic)
            currency.groupId = null;
            const updatedCurrency = await this.currencyRepository.save(currency);

            return {
                success: true,
                data: updatedCurrency,
                message: 'Currency removed from group successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in removeCurrencyFromGroup:', error);
            return {
                success: false,
                data: null,
                message: `Failed to remove currency from group: ${error.message}`,
                loading: false
            };
        }
    }

    // Get all company rates with company details
    async getAllCompanyRates(): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        try {
            const rates = await this.companyRateRepository.find({
                where: { isActive: true },
                relations: ['company'],
                order: { companyId: 'ASC', groupId: 'ASC' }
            });

            return {
                success: true,
                data: rates,
                message: 'Company rates retrieved successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in getAllCompanyRates:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve company rates: ${error.message}`,
                loading: false
            };
        }
    }

    // Company Rate Methods by Group
    async getCompanyRatesByGroup(groupId: number): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        try {
            const rates = await this.companyRateRepository.find({
                where: { groupId, isActive: true },
                relations: ['company'],
                order: { companyId: 'ASC' }
            });

            return {
                success: true,
                data: rates,
                message: 'Company rates retrieved successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in getCompanyRatesByGroup:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve company rates: ${error.message}`,
                loading: false
            };
        }
    }

    // Bulk Company Rate Methods
    async createBulkCompanyRates(bulkDto: BulkCompanyRateDto): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        try {
            const createdRates: CompanyCurrencyRateEntity[] = [];

            for (const rateData of bulkDto.rates) {
                // Check if company exists
                const company = await this.companyRepository.findOne({
                    where: { id: rateData.companyId, isActive: true }
                });

                if (!company) {
                    throw new NotFoundException(`Company with ID ${rateData.companyId} not found`);
                }

                // Check if group exists
                const group = await this.currencyGroupRepository.findOne({
                    where: { id: rateData.groupId, isActive: true }
                });

                if (!group) {
                    throw new NotFoundException(`Currency group with ID ${rateData.groupId} not found`);
                }

                // Check if rate already exists
                const existingRate = await this.companyRateRepository.findOne({
                    where: { companyId: rateData.companyId, groupId: rateData.groupId }
                });

                if (existingRate) {
                    // Calculate conversion rate: awRate + mpRate
                    const awRate = rateData.awRate !== undefined ? rateData.awRate : (existingRate.awRate || 2);
                    const mpRate = rateData.mpRate !== undefined ? rateData.mpRate : (existingRate.mpRate || 0);
                    const conversionRate = awRate + mpRate;

                    // Update existing rate
                    existingRate.conversionRate = conversionRate;
                    existingRate.awRate = awRate;
                    existingRate.mpRate = rateData.mpRate;
                    existingRate.notes = rateData.notes;
                    existingRate.isActive = true;
                    
                    const updatedRate = await this.companyRateRepository.save(existingRate);
                    createdRates.push(updatedRate);
                } else {
                    // Calculate conversion rate: awRate + mpRate
                    const awRate = rateData.awRate !== undefined ? rateData.awRate : 2;
                    const mpRate = rateData.mpRate !== undefined ? rateData.mpRate : 0;
                    const conversionRate = awRate + mpRate;

                    // Create new rate
                    const rate = this.companyRateRepository.create({
                        ...rateData,
                        conversionRate,
                        awRate,
                        mpRate: rateData.mpRate,
                        isActive: true
                    });
                    const savedRate = await this.companyRateRepository.save(rate);
                    createdRates.push(savedRate);
                }
            }

            return {
                success: true,
                data: createdRates,
                message: `Bulk company rates created/updated successfully (${createdRates.length} rates)`,
                loading: false
            };
        } catch (error) {
            console.error('Error in createBulkCompanyRates:', error);
            return {
                success: false,
                data: null,
                message: `Failed to create bulk company rates: ${error.message}`,
                loading: false
            };
        }
    }

    // Rate Template Methods (Mock implementation - you might want to create a separate entity)
    async getRateTemplates(): Promise<BaseApiResponse<any[]>> {
        try {
            // Mock data - in real implementation, you would have a RateTemplateEntity
            const templates = [
                {
                    id: 1,
                    name: 'Standard Rates',
                    description: 'Standard conversion rates for all companies',
                    defaultConversionRate: 0.85,
                    defaultFeePercentage: 2.5,
                    isActive: true
                },
                {
                    id: 2,
                    name: 'Premium Rates',
                    description: 'Premium rates for VIP companies',
                    defaultConversionRate: 0.90,
                    defaultFeePercentage: 1.5,
                    isActive: true
                },
                {
                    id: 3,
                    name: 'Economy Rates',
                    description: 'Economy rates for cost-sensitive companies',
                    defaultConversionRate: 0.80,
                    defaultFeePercentage: 3.0,
                    isActive: true
                }
            ];

            return {
                success: true,
                data: templates,
                message: 'Rate templates retrieved successfully',
                loading: false
            };
        } catch (error) {
            console.error('Error in getRateTemplates:', error);
            return {
                success: false,
                data: null,
                message: `Failed to retrieve rate templates: ${error.message}`,
                loading: false
            };
        }
    }
}
