import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../common/services/base.service';
import { TransferMarkupRateEntity } from '../entities/transfer-markup-rate.entity';
import { PlanEntity } from '../plan/plan.entity';
import { CompanyEntity } from '../company/company.entity';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginatedResponseDto, PaginationDto } from '../common/models/pagination-dto';
import { CreateTransferMarkupRateDto } from './dtos/create-transfer-markup-rate.dto';
import { UpdateTransferMarkupRateDto } from './dtos/update-transfer-markup-rate.dto';
import {
  GroupedRatesResponseDto,
  RegionRatesDto,
  CountryRatesDto,
  CurrencyRatesDto,
  TransferMethodRatesDto,
  PlanRatesSummaryDto,
} from './dtos/grouped-rate-response.dto';
import { BulkUpdateRatesDto, BulkUpdateResponseDto } from './dtos/bulk-update-rate.dto';
import { GetRateByAccountDto } from './dtos/get-rate-by-account.dto';

@Injectable()
export class TransferMarkupRatesService extends BaseService<TransferMarkupRateEntity> {
  constructor(
    @InjectRepository(TransferMarkupRateEntity)
    private readonly transferMarkupRateRepository: Repository<TransferMarkupRateEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {
    super(transferMarkupRateRepository);
  }

  /**
   * List transfer markup rates with pagination
   */
  async listTransferMarkupRatesPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<TransferMarkupRateEntity>> {
    return await this.findAllWithPagination({
      ...paginationDto,
      select: [],
      relations: ['plan'],
      where: { isDeleted: false },
    });
  }

  /**
   * Find rates by country code
   */
  async findByCountryCode(countryCode: string): Promise<TransferMarkupRateEntity[]> {
    return await this.transferMarkupRateRepository.find({
      where: {
        countryCode: countryCode.toUpperCase(),
        isDeleted: false,
      },
      relations: ['plan'],
      order: {
        planId: 'ASC',
        transferMethod: 'ASC',
      },
    });
  }

  /**
   * Find rates by currency
   */
  async findByCurrency(currency: string): Promise<TransferMarkupRateEntity[]> {
    return await this.transferMarkupRateRepository.find({
      where: {
        currency: currency.toUpperCase(),
        isDeleted: false,
      },
      relations: ['plan'],
      order: {
        planId: 'ASC',
        countryCode: 'ASC',
      },
    });
  }

  /**
   * Find rates by transfer method
   */
  async findByTransferMethod(method: 'local' | 'swift'): Promise<TransferMarkupRateEntity[]> {
    return await this.transferMarkupRateRepository.find({
      where: {
        transferMethod: method,
        isDeleted: false,
      },
      relations: ['plan'],
      order: {
        planId: 'ASC',
        countryCode: 'ASC',
      },
    });
  }

  /**
   * Get summary of all plans with their rate counts
   */
  async getPlansSummary(): Promise<BaseApiResponse<PlanRatesSummaryDto[]>> {
    try {
      const plans = await this.planRepository.find({
        where: { isDeleted: false },
        order: { level: 'ASC' },
      });

      const summaries: PlanRatesSummaryDto[] = [];

      for (const plan of plans) {
        const rates = await this.transferMarkupRateRepository.find({
          where: {
            planId: plan.id,
            isDeleted: false,
          },
        });

        const localRates = rates.filter((r) => r.transferMethod === 'local').length;
        const swiftRates = rates.filter((r) => r.transferMethod === 'swift').length;

        const uniqueCountries = new Set(rates.map((r) => r.countryCode)).size;
        const uniqueRegions = new Set(rates.map((r) => r.region)).size;

        summaries.push({
          planId: plan.id!,
          planName: plan.name,
          planLevel: plan.level,
          totalRates: rates.length,
          localRates,
          swiftRates,
          countriesCount: uniqueCountries,
          regionsCount: uniqueRegions,
        });
      }

      return {
        success: true,
        message: 'Plans summary retrieved successfully',
        data: summaries,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve plans summary');
    }
  }

  /**
   * Get grouped rates for a specific plan
   */
  async getGroupedRates(planId: number): Promise<BaseApiResponse<GroupedRatesResponseDto>> {
    const plan = await this.planRepository.findOne({
      where: { id: planId, isDeleted: false },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const rates = await this.transferMarkupRateRepository.find({
      where: {
        planId,
        isDeleted: false,
      },
      order: {
        region: 'ASC',
        country: 'ASC',
        currency: 'ASC',
      },
    });

    // Group by Region > Country > Currency > Transaction Type > Transfer Method
    const regionMap = new Map<string, Map<string, Map<string, Map<string, TransferMarkupRateEntity[]>>>>();

    for (const rate of rates) {
      if (!regionMap.has(rate.region)) {
        regionMap.set(rate.region, new Map());
      }
      const countryMap = regionMap.get(rate.region)!;

      const countryKey = `${rate.countryCode}`;
      if (!countryMap.has(countryKey)) {
        countryMap.set(countryKey, new Map());
      }
      const currencyMap = countryMap.get(countryKey)!;

      if (!currencyMap.has(rate.currency)) {
        currencyMap.set(rate.currency, new Map());
      }
      const transactionTypeMap = currencyMap.get(rate.currency)!;

      const transactionType = rate.transactionType || 'default';
      if (!transactionTypeMap.has(transactionType)) {
        transactionTypeMap.set(transactionType, []);
      }
      transactionTypeMap.get(transactionType)!.push(rate);
    }

    // Build the response structure
    const regions: RegionRatesDto[] = [];

    for (const [regionName, countryMap] of regionMap) {
      const countries: CountryRatesDto[] = [];

      for (const [countryKey, currencyMap] of countryMap) {
        const firstRate = Array.from(currencyMap.values())[0].values().next().value[0];
        const currencies: CurrencyRatesDto[] = [];

        for (const [currency, transactionTypeMap] of currencyMap) {
          const transactionTypes: Record<string, TransferMethodRatesDto> = {};

          for (const [transactionType, ratesList] of transactionTypeMap) {
            const transferMethodRates: TransferMethodRatesDto = {};
            
            const localRates = ratesList.filter((r) => r.transferMethod === 'local');
            const swiftRates = ratesList.filter((r) => r.transferMethod === 'swift');

            if (localRates.length > 0) {
              transferMethodRates.local = localRates;
            }
            if (swiftRates.length > 0) {
              transferMethodRates.swift = swiftRates;
            }

            transactionTypes[transactionType] = transferMethodRates;
          }

          currencies.push({
            currency,
            transactionTypes,
          });
        }

        countries.push({
          countryCode: firstRate.countryCode,
          countryName: firstRate.country,
          region: firstRate.region,
          currencies,
        });
      }

      regions.push({
        region: regionName,
        countries,
      });
    }

    const localRatesCount = rates.filter((r) => r.transferMethod === 'local').length;
    const swiftRatesCount = rates.filter((r) => r.transferMethod === 'swift').length;

    const response: GroupedRatesResponseDto = {
      planId: plan.id!,
      planName: plan.name,
      planLevel: plan.level,
      regions,
      totalRates: rates.length,
      localRatesCount,
      swiftRatesCount,
    };

    return {
      success: true,
      message: 'Grouped rates retrieved successfully',
      data: response,
    };
  }

  /**
   * Get filtered rates with flexible criteria
   */
  async getFilteredRates(
    planId?: number,
    region?: string,
    countryCode?: string,
    currency?: string,
    transferMethod?: 'local' | 'swift',
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    const where: any = { isDeleted: false };

    if (planId !== undefined) {
      where.planId = planId;
    }
    if (region) {
      where.region = region;
    }
    if (countryCode) {
      where.countryCode = countryCode.toUpperCase();
    }
    if (currency) {
      where.currency = currency.toUpperCase();
    }
    if (transferMethod) {
      where.transferMethod = transferMethod;
    }

    const rates = await this.transferMarkupRateRepository.find({
      where,
      relations: ['plan'],
      order: {
        region: 'ASC',
        country: 'ASC',
        currency: 'ASC',
        transferMethod: 'ASC',
      },
    });

    return {
      success: true,
      message: 'Filtered rates retrieved successfully',
      data: rates,
    };
  }

  /**
   * Get available regions
   */
  async getAvailableRegions(): Promise<BaseApiResponse<string[]>> {
    const rates = await this.transferMarkupRateRepository.find({
      where: { isDeleted: false },
      select: ['region'],
    });

    const uniqueRegions = Array.from(new Set(rates.map((r) => r.region))).sort();

    return {
      success: true,
      message: 'Available regions retrieved successfully',
      data: uniqueRegions,
    };
  }

  /**
   * Get available countries, optionally filtered by region
   */
  async getAvailableCountries(
    region?: string,
  ): Promise<BaseApiResponse<Array<{ code: string; name: string; region: string }>>> {
    const where: any = { isDeleted: false };
    if (region) {
      where.region = region;
    }

    const rates = await this.transferMarkupRateRepository.find({
      where,
      select: ['countryCode', 'country', 'region'],
    });

    // Create unique countries map
    const countriesMap = new Map<string, { code: string; name: string; region: string }>();
    
    for (const rate of rates) {
      if (!countriesMap.has(rate.countryCode)) {
        countriesMap.set(rate.countryCode, {
          code: rate.countryCode,
          name: rate.country,
          region: rate.region,
        });
      }
    }

    const countries = Array.from(countriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      message: 'Available countries retrieved successfully',
      data: countries,
    };
  }

  /**
   * Find specific rate by plan, country, currency and transfer method
   */
  async findSpecificRate(
    planId: number,
    countryCode: string,
    currency: string,
    transferMethod: 'local' | 'swift',
  ): Promise<TransferMarkupRateEntity | null> {
    return await this.transferMarkupRateRepository.findOne({
      where: {
        planId,
        countryCode: countryCode.toUpperCase(),
        currency: currency.toUpperCase(),
        transferMethod,
        isDeleted: false,
      },
      relations: ['plan'],
    });
  }

  /**
   * Get all rates for a specific plan
   */
  async getRatesByPlan(planId: number): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    const plan = await this.planRepository.findOne({
      where: { id: planId, isDeleted: false },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const rates = await this.transferMarkupRateRepository.find({
      where: {
        planId,
        isDeleted: false,
      },
      relations: ['plan'],
      order: {
        region: 'ASC',
        country: 'ASC',
        currency: 'ASC',
      },
    });

    return {
      success: true,
      message: `Transfer markup rates for plan ${planId} fetched successfully`,
      data: rates,
    };
  }

  /**
   * Get paginated rates for a specific plan
   */
  async getRatesByPlanPaginated(
    planId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<TransferMarkupRateEntity>> {
    const plan = await this.planRepository.findOne({
      where: { id: planId, isDeleted: false },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    return await this.findAllWithPagination({
      ...paginationDto,
      select: [],
      relations: ['plan'],
      where: { planId, isDeleted: false },
    });
  }

  /**
   * Create a new transfer markup rate
   */
  async createTransferMarkupRate(
    createDto: CreateTransferMarkupRateDto,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    try {
      // Check if plan exists
      const plan = await this.planRepository.findOne({
        where: { id: createDto.planId, isDeleted: false },
      });

      if (!plan) {
        return {
          success: false,
          message: `Plan with ID ${createDto.planId} not found`,
          data: null,
        };
      }

      // Check for duplicate
      const existing = await this.transferMarkupRateRepository.findOne({
        where: {
          planId: createDto.planId,
          countryCode: createDto.countryCode.toUpperCase(),
          currency: createDto.currency.toUpperCase(),
          transferMethod: createDto.transferMethod,
          isDeleted: false,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Rate already exists for plan ${createDto.planId}, country ${createDto.countryCode}, currency ${createDto.currency}, and transfer method ${createDto.transferMethod}`,
        );
      }

      // Set default fee currency if not provided
      const feeCurrency = createDto.feeCurrency || createDto.currency;

      // Create entity
      const entity = this.transferMarkupRateRepository.create({
        ...createDto,
        countryCode: createDto.countryCode.toUpperCase(),
        currency: createDto.currency.toUpperCase(),
        feeCurrency: feeCurrency.toUpperCase(),
        isDeleted: false,
      });

      const saved = await this.transferMarkupRateRepository.save(entity);

      return {
        success: true,
        message: 'Transfer markup rate created successfully',
        data: saved,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create transfer markup rate');
    }
  }

  /**
   * Update a transfer markup rate
   */
  async updateTransferMarkupRate(
    id: number,
    updateDto: UpdateTransferMarkupRateDto,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    const rate = await this.transferMarkupRateRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!rate) {
      return {
        success: false,
        message: `Transfer markup rate with ID ${id} not found`,
        data: null,
      };
    }

    // If planId is being updated, check if plan exists
    if (updateDto.planId && updateDto.planId !== rate.planId) {
      const plan = await this.planRepository.findOne({
        where: { id: updateDto.planId, isDeleted: false },
      });

      if (!plan) {
        return {
          success: false,
          message: `Plan with ID ${updateDto.planId} not found`,
          data: null,
        };
      }
    }

    // Check for duplicates ONLY if unique fields are actually being changed
    const planIdChanged = updateDto.planId !== undefined && updateDto.planId !== rate.planId;
    const countryCodeChanged = updateDto.countryCode !== undefined && 
      updateDto.countryCode.toUpperCase() !== rate.countryCode;
    const currencyChanged = updateDto.currency !== undefined && 
      updateDto.currency.toUpperCase() !== rate.currency;
    const transferMethodChanged = updateDto.transferMethod !== undefined && 
      updateDto.transferMethod !== rate.transferMethod;

    if (planIdChanged || countryCodeChanged || currencyChanged || transferMethodChanged) {
      const checkPlanId = updateDto.planId !== undefined ? updateDto.planId : rate.planId;
      const checkCountryCode = updateDto.countryCode !== undefined 
        ? updateDto.countryCode.toUpperCase() 
        : rate.countryCode;
      const checkCurrency = updateDto.currency !== undefined 
        ? updateDto.currency.toUpperCase() 
        : rate.currency;
      const checkTransferMethod = updateDto.transferMethod !== undefined 
        ? updateDto.transferMethod 
        : rate.transferMethod;

      const existing = await this.transferMarkupRateRepository.findOne({
        where: {
          planId: checkPlanId,
          countryCode: checkCountryCode,
          currency: checkCurrency,
          transferMethod: checkTransferMethod,
          isDeleted: false,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Rate already exists for plan ${checkPlanId}, country ${checkCountryCode}, currency ${checkCurrency}, and transfer method ${checkTransferMethod}`,
        );
      }
    }

    // Normalize string fields
    const updateData: any = { ...updateDto };
    if (updateDto.countryCode) {
      updateData.countryCode = updateDto.countryCode.toUpperCase();
    }
    if (updateDto.currency) {
      updateData.currency = updateDto.currency.toUpperCase();
    }
    if (updateDto.feeCurrency) {
      updateData.feeCurrency = updateDto.feeCurrency.toUpperCase();
    }

    // Merge and save
    const updated = this.transferMarkupRateRepository.merge(rate, updateData);
    const saved = await this.transferMarkupRateRepository.save(updated);

    return {
      success: true,
      message: 'Transfer markup rate updated successfully',
      data: saved,
    };
  }

  /**
   * Soft delete a transfer markup rate
   */
  async softDeleteTransferMarkupRate(id: number): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    const rate = await this.transferMarkupRateRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!rate) {
      return {
        success: false,
        message: `Transfer markup rate with ID ${id} not found`,
        data: null,
      };
    }

    rate.isDeleted = true;
    rate.updatedAt = new Date();
    const deleted = await this.transferMarkupRateRepository.save(rate);

    return {
      success: true,
      message: 'Transfer markup rate deleted successfully',
      data: deleted,
    };
  }

  /**
   * Restore a soft-deleted transfer markup rate
   */
  async restoreTransferMarkupRate(id: number): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    const rate = await this.transferMarkupRateRepository.findOne({
      where: { id, isDeleted: true },
    });

    if (!rate) {
      return {
        success: false,
        message: `Deleted transfer markup rate with ID ${id} not found`,
        data: null,
      };
    }

    rate.isDeleted = false;
    rate.updatedAt = new Date();
    const restored = await this.transferMarkupRateRepository.save(rate);

    return {
      success: true,
      message: 'Transfer markup rate restored successfully',
      data: restored,
    };
  }

  /**
   * Bulk update multiple rates
   */
  async bulkUpdateRates(
    bulkUpdateDto: BulkUpdateRatesDto,
  ): Promise<BaseApiResponse<BulkUpdateResponseDto>> {
    const response: BulkUpdateResponseDto = {
      successCount: 0,
      failureCount: 0,
      successfulIds: [],
      failures: [],
    };

    for (const rateUpdate of bulkUpdateDto.rates) {
      try {
        const rate = await this.transferMarkupRateRepository.findOne({
          where: { id: rateUpdate.id, isDeleted: false },
        });

        if (!rate) {
          response.failureCount++;
          response.failures.push({
            id: rateUpdate.id,
            error: `Rate with ID ${rateUpdate.id} not found`,
          });
          continue;
        }

        // Update only provided fields
        if (rateUpdate.feeShaPercentage !== undefined) {
          rate.feeShaPercentage = rateUpdate.feeShaPercentage;
        }
        if (rateUpdate.feeShaMinimum !== undefined) {
          rate.feeShaMinimum = rateUpdate.feeShaMinimum;
        }
        if (rateUpdate.feeOurPercentage !== undefined) {
          rate.feeOurPercentage = rateUpdate.feeOurPercentage;
        }
        if (rateUpdate.feeOurMinimum !== undefined) {
          rate.feeOurMinimum = rateUpdate.feeOurMinimum;
        }

        await this.transferMarkupRateRepository.save(rate);
        response.successCount++;
        response.successfulIds.push(rateUpdate.id);
      } catch (error) {
        response.failureCount++;
        response.failures.push({
          id: rateUpdate.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: response.failureCount === 0,
      message:
        response.failureCount === 0
          ? 'All rates updated successfully'
          : `${response.successCount} rates updated, ${response.failureCount} failed`,
      data: response,
    };
  }

  /**
   * Duplicate transfer markup rates from one plan to another
   */
  async duplicateTransferMarkupRates(
    sourcePlanId: number,
    targetPlanId: number,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    try {
      console.log("sourcePlanId",sourcePlanId);
      console.log("targetPlanId",targetPlanId);
      console.log("checking source plan");
      // Check if source plan exists
      const sourcePlan = await this.planRepository.findOne({ where: { id: sourcePlanId, isDeleted: false } });
      if (!sourcePlan) {
        throw new NotFoundException(`Source plan with ID ${sourcePlanId} not found`);
      }

      // Check if target plan exists
      const targetPlan = await this.planRepository.findOne({ where: { id: targetPlanId, isDeleted: false } });
      if (!targetPlan) {
        throw new NotFoundException(`Target plan with ID ${targetPlanId} not found`);
      }

      // Get all rates from source plan
      const sourceRates = await this.transferMarkupRateRepository.find({
        where: { planId: sourcePlanId, isDeleted: false },
      });

      if (sourceRates.length === 0) {
        return {
          success: true,
          data: [],
          message: `No transfer markup rates found in source plan ${sourcePlanId} to duplicate`,
        };
      }

      // Check if target plan already has rates
      const existingTargetRates = await this.transferMarkupRateRepository.find({
        where: { planId: targetPlanId, isDeleted: false },
      });
      if (existingTargetRates.length > 0) {
        throw new ConflictException(`Target plan ${targetPlanId} already has transfer markup rates. Cannot duplicate.`);
      }
console.log("sourceRates",sourceRates);
      // Create new rates for target plan
      const newRates = sourceRates.map(sourceRate => {
        return this.transferMarkupRateRepository.create({
          planId: targetPlanId,
          region: sourceRate.region,
          country: sourceRate.country,
          countryCode: sourceRate.countryCode,
          currency: sourceRate.currency,
          transactionType: sourceRate.transactionType,
          transferMethod: sourceRate.transferMethod,
          feeShaPercentage: sourceRate.feeShaPercentage,
          feeShaMinimum: sourceRate.feeShaMinimum,
          feeOurPercentage: sourceRate.feeOurPercentage,
          feeOurMinimum: sourceRate.feeOurMinimum,
          feeCurrency: sourceRate.feeCurrency,
          isDeleted: false,
        });
      });

      const savedRates = await this.transferMarkupRateRepository.save(newRates);

      return {
        success: true,
        data: savedRates,
        message: `Successfully duplicated ${savedRates.length} transfer markup rates from plan ${sourcePlanId} to plan ${targetPlanId}`,
      };
    } catch (error) {
      console.log("error",error);
      return {
        success: false,
        data: null,
        message: `Failed to duplicate transfer markup rates: ${error.message}`,
      };
    }
  }

  /**
   * Get transfer markup rate by connected account ID and transfer criteria
   * This method finds the company by airwallex_account_id, gets its plan,
   * and returns the appropriate transfer markup rate based on the criteria
   */
  async getRateByConnectedAccount(
    dto: GetRateByAccountDto,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity | null>> {
    try {
      // Step 1: Find company by connected account ID (airwallex_account_id)
      const company = await this.companyRepository.findOne({
        where: {
          airwallex_account_id: dto.connectedAccountId,
          isDeleted: false,
        },
        relations: ['plan'],
      });

      if (!company) {
        return {
          success: false,
          message: `Company with connected account ID ${dto.connectedAccountId} not found`,
          data: null,
        };
      }

      if (!company.planId) {
        return {
          success: false,
          message: `Company ${company.name} does not have an assigned plan`,
          data: null,
        };
      }

      // Normalize inputs
      const currency = dto.currency.toUpperCase();
      const transferMethod = dto.transferMethod;
      const countryCode = dto.countryCode?.toUpperCase();
      const transactionType = dto.transactionType;

      // Step 2: Build query based on transfer method
      let rate: TransferMarkupRateEntity | null = null;

      if (transferMethod === 'swift') {
        // For SWIFT, only use planId, currency, and transfer_method
        rate = await this.transferMarkupRateRepository.findOne({
          where: {
            planId: company.planId,
            currency,
            transferMethod,
            isDeleted: false,
          },
          relations: ['plan'],
          order: {
            id: 'ASC',
          },
        });
      } else {
        // For LOCAL transfers, country_code is required
        if (!countryCode) {
          return {
            success: false,
            message: 'Country code is required for local transfers',
            data: null,
          };
        }

        if (transactionType) {
          // Search with specific transaction_type
          rate = await this.transferMarkupRateRepository.findOne({
            where: {
              planId: company.planId,
              currency,
              countryCode,
              transferMethod,
              transactionType,
              isDeleted: false,
            },
            relations: ['plan'],
            order: {
              id: 'ASC',
            },
          });
        } else {
          // Search without transaction_type (NULL or empty)
          rate = await this.transferMarkupRateRepository
            .createQueryBuilder('rate')
            .leftJoinAndSelect('rate.plan', 'plan')
            .where('rate.planId = :planId', { planId: company.planId })
            .andWhere('rate.currency = :currency', { currency })
            .andWhere('rate.countryCode = :countryCode', { countryCode })
            .andWhere('rate.transferMethod = :transferMethod', { transferMethod })
            .andWhere('rate.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('(rate.transactionType IS NULL OR rate.transactionType = :empty)', { empty: '' })
            .orderBy('rate.id', 'ASC')
            .getOne();
        }
      }

      // Step 3: Apply fallback logic for EUR/LOCAL transfers - try SEPA
      if (!rate && currency === 'EUR' && transferMethod === 'local' && countryCode) {
        rate = await this.transferMarkupRateRepository.findOne({
          where: {
            planId: company.planId,
            transactionType: 'SEPA',
            isDeleted: false,
          },
          relations: ['plan'],
          order: {
            id: 'ASC',
          },
        });

        if (rate) {
          return {
            success: true,
            message: 'Transfer markup rate found (SEPA fallback for EUR/LOCAL)',
            data: rate,
          };
        }
      }

      // Step 4: Return result
      if (!rate) {
        return {
          success: false,
          message: 'No markup rate found for the specified criteria',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Transfer markup rate found successfully',
        data: rate,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to fetch markup rate',
      );
    }
  }
}
