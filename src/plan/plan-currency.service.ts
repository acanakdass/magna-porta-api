import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanCurrencyRateEntity } from '../entities/plan-currency-rate.entity';
import { PlanEntity } from './plan.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';
import { CreatePlanRateDto } from './dtos/create-plan-rate.dto';
import { UpdatePlanRateDto } from './dtos/update-plan-rate.dto';
import { PlanRateResponseDto } from './dtos/plan-rate-response.dto';
import { BulkPlanRateDto } from './dtos/bulk-plan-rate.dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginatedResponseDto, PaginationDto } from '../common/models/pagination-dto';

@Injectable()
export class PlanCurrencyService {
  constructor(
    @InjectRepository(PlanCurrencyRateEntity)
    private readonly planRateRepo: Repository<PlanCurrencyRateEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
    @InjectRepository(CurrencyGroupEntity)
    private readonly currencyGroupRepo: Repository<CurrencyGroupEntity>,
  ) {}

  async createPlanRate(createDto: CreatePlanRateDto): Promise<BaseApiResponse<PlanRateResponseDto>> {
    try {
      // Check if plan exists
      const plan = await this.planRepo.findOne({ where: { id: createDto.planId } });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${createDto.planId} not found`);
      }

      // Check if currency group exists
      const currencyGroup = await this.currencyGroupRepo.findOne({ where: { id: createDto.groupId } });
      if (!currencyGroup) {
        throw new NotFoundException(`Currency group with ID ${createDto.groupId} not found`);
      }

      // Check if rate already exists for this plan and group
      const existingRate = await this.planRateRepo.findOne({
        where: { planId: createDto.planId, groupId: createDto.groupId }
      });

      if (existingRate) {
        throw new ConflictException(`Rate already exists for plan ${createDto.planId} and group ${createDto.groupId}`);
      }

      // Calculate conversion rate if not provided
      let conversionRate = createDto.conversionRate;
      if (createDto.awRate !== undefined && createDto.mpRate !== undefined) {
        conversionRate = createDto.awRate + createDto.mpRate;
      }

      const planRate = this.planRateRepo.create({
        ...createDto,
        conversionRate,
        awRate: createDto.awRate ?? 2.0, // Default Airwallex rate
        mpRate: createDto.mpRate ?? 0,
        isActive: createDto.isActive ?? true
      });

      const savedRate = await this.planRateRepo.save(planRate);

      return {
        success: true,
        data: PlanRateResponseDto.fromEntity(savedRate),
        message: 'Plan currency rate created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to create plan currency rate: ${error.message}`
      };
    }
  }

  async getAllPlanRates(): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    try {
      const rates = await this.planRateRepo.find({
        relations: ['plan', 'currencyGroup'],
        order: { planId: 'ASC', groupId: 'ASC' }
      });

      const rateDtos = rates.map(rate => PlanRateResponseDto.fromEntity(rate));

      return {
        success: true,
        data: rateDtos,
        message: 'Plan currency rates retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to retrieve plan currency rates: ${error.message}`
      };
    }
  }

  async getPlanRatesByPlan(planId: number): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    try {
      const plan = await this.planRepo.findOne({ where: { id: planId } });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${planId} not found`);
      }

      const rates = await this.planRateRepo.find({
        where: { planId },
        relations: ['currencyGroup'],
        order: { groupId: 'ASC' }
      });

      const rateDtos = rates.map(rate => PlanRateResponseDto.fromEntity(rate));

      return {
        success: true,
        data: rateDtos,
        message: `Currency rates for plan ${planId} retrieved successfully`
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to retrieve plan currency rates: ${error.message}`
      };
    }
  }

  async getPlanRateById(id: number): Promise<BaseApiResponse<PlanRateResponseDto>> {
    try {
      const rate = await this.planRateRepo.findOne({
        where: { id },
        relations: ['plan', 'currencyGroup']
      });

      if (!rate) {
        throw new NotFoundException(`Plan currency rate with ID ${id} not found`);
      }

      return {
        success: true,
        data: PlanRateResponseDto.fromEntity(rate),
        message: 'Plan currency rate retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to retrieve plan currency rate: ${error.message}`
      };
    }
  }

  async updatePlanRate(id: number, updateDto: UpdatePlanRateDto): Promise<BaseApiResponse<PlanRateResponseDto>> {
    try {
      const rate = await this.planRateRepo.findOne({ where: { id } });

      if (!rate) {
        throw new NotFoundException(`Plan currency rate with ID ${id} not found`);
      }

      // Check if plan exists (if planId is being updated)
      if (updateDto.planId && updateDto.planId !== rate.planId) {
        const plan = await this.planRepo.findOne({ where: { id: updateDto.planId } });
        if (!plan) {
          throw new NotFoundException(`Plan with ID ${updateDto.planId} not found`);
        }

        // Check if new combination already exists
        const existingRate = await this.planRateRepo.findOne({
          where: { planId: updateDto.planId, groupId: updateDto.groupId ?? rate.groupId }
        });

        if (existingRate && existingRate.id !== id) {
          throw new ConflictException(`Rate already exists for plan ${updateDto.planId} and group ${updateDto.groupId ?? rate.groupId}`);
        }
      }

      // Check if currency group exists (if groupId is being updated)
      if (updateDto.groupId && updateDto.groupId !== rate.groupId) {
        const currencyGroup = await this.currencyGroupRepo.findOne({ where: { id: updateDto.groupId } });
        if (!currencyGroup) {
          throw new NotFoundException(`Currency group with ID ${updateDto.groupId} not found`);
        }

        // Check if new combination already exists
        const existingRate = await this.planRateRepo.findOne({
          where: { planId: updateDto.planId ?? rate.planId, groupId: updateDto.groupId }
        });

        if (existingRate && existingRate.id !== id) {
          throw new ConflictException(`Rate already exists for plan ${updateDto.planId ?? rate.planId} and group ${updateDto.groupId}`);
        }
      }

      // Calculate new conversion rate if awRate or mpRate are being updated
      let newConversionRate = updateDto.conversionRate ?? rate.conversionRate;
      if (updateDto.awRate !== undefined || updateDto.mpRate !== undefined) {
        const awRate = updateDto.awRate ?? rate.awRate ?? 2.0;
        const mpRate = updateDto.mpRate ?? rate.mpRate ?? 0;
        newConversionRate = awRate + mpRate;
      }

      Object.assign(rate, updateDto, { conversionRate: newConversionRate });
      const updatedRate = await this.planRateRepo.save(rate);

      return {
        success: true,
        data: PlanRateResponseDto.fromEntity(updatedRate),
        message: 'Plan currency rate updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to update plan currency rate: ${error.message}`
      };
    }
  }

  async deletePlanRate(id: number): Promise<BaseApiResponse<void>> {
    try {
      const rate = await this.planRateRepo.findOne({ where: { id } });

      if (!rate) {
        throw new NotFoundException(`Plan currency rate with ID ${id} not found`);
      }

      await this.planRateRepo.remove(rate);

      return {
        success: true,
        data: undefined,
        message: 'Plan currency rate deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to delete plan currency rate: ${error.message}`
      };
    }
  }

  async bulkCreatePlanRates(bulkDto: BulkPlanRateDto): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    try {
      // Check if plan exists
      const plan = await this.planRepo.findOne({ where: { id: bulkDto.planId } });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${bulkDto.planId} not found`);
      }

      // Check for existing rates
      const existingRates = await this.planRateRepo.find({
        where: { planId: bulkDto.planId }
      });

      const existingGroupIds = existingRates.map(rate => rate.groupId);
      const newGroupIds = bulkDto.rates.map(rate => rate.groupId);
      const conflictingGroups = existingGroupIds.filter(id => newGroupIds.includes(id));

      if (conflictingGroups.length > 0) {
        throw new ConflictException(`Rates already exist for groups: ${conflictingGroups.join(', ')}`);
      }

      // Validate all currency groups exist
      const groupIds = bulkDto.rates.map(rate => rate.groupId);
      const currencyGroups = await this.currencyGroupRepo.findByIds(groupIds);

      if (currencyGroups.length !== groupIds.length) {
        const foundGroupIds = currencyGroups.map(group => group.id);
        const missingGroupIds = groupIds.filter(id => !foundGroupIds.includes(id));
        throw new NotFoundException(`Currency groups not found: ${missingGroupIds.join(', ')}`);
      }

      // Create plan rates
      const planRates = bulkDto.rates.map(rateData => {
        const conversionRate = (rateData.awRate ?? 2.0) + (rateData.mpRate ?? 0);
        return this.planRateRepo.create({
          planId: bulkDto.planId,
          groupId: rateData.groupId,
          conversionRate,
          awRate: rateData.awRate ?? 2.0,
          mpRate: rateData.mpRate ?? 0,
          isActive: true
        });
      });

      const savedRates = await this.planRateRepo.save(planRates);
      const rateDtos = savedRates.map(rate => PlanRateResponseDto.fromEntity(rate));

      return {
        success: true,
        data: rateDtos,
        message: `${savedRates.length} plan currency rates created successfully`
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to create plan currency rates: ${error.message}`
      };
    }
  }

  async listPlanRatesPaginated(paginationDto: PaginationDto): Promise<PaginatedResponseDto<PlanRateResponseDto>> {
    try {
      const queryBuilder = this.planRateRepo.createQueryBuilder('planRate')
        .leftJoinAndSelect('planRate.plan', 'plan')
        .leftJoinAndSelect('planRate.currencyGroup', 'currencyGroup')
        .orderBy('planRate.planId', 'ASC')
        .addOrderBy('planRate.groupId', 'ASC');

      const total = await queryBuilder.getCount();
      const rates = await queryBuilder
        .skip((paginationDto.page - 1) * paginationDto.limit)
        .take(paginationDto.limit)
        .getMany();

      const rateDtos = rates.map(rate => PlanRateResponseDto.fromEntity(rate));

      return {
        data: rateDtos,
        meta: {
          totalItems: total,
          itemsPerPage: paginationDto.limit,
          totalPages: Math.ceil(total / paginationDto.limit),
          currentPage: paginationDto.page
        }
      };
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve plan currency rates: ${error.message}`);
    }
  }

  // Get plan rate for specific group
  async getPlanRateForGroup(planId: number, groupId: number): Promise<BaseApiResponse<PlanRateResponseDto>> {
    try {
      const rate = await this.planRateRepo.findOne({
        where: { planId, groupId, isActive: true },
        relations: ['plan', 'currencyGroup']
      });

      if (!rate) {
        throw new NotFoundException('Rate not found for this plan and group');
      }

      return {
        success: true,
        data: PlanRateResponseDto.fromEntity(rate),
        message: 'Plan rate retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to retrieve plan rate: ${error.message}`
      };
    }
  }

  // Get plan rates by group
  async getPlanRatesByGroup(groupId: number): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    try {
      const rates = await this.planRateRepo.find({
        where: { groupId, isActive: true },
        relations: ['plan', 'currencyGroup'],
        order: { planId: 'ASC' }
      });

      const rateDtos = rates.map(rate => PlanRateResponseDto.fromEntity(rate));

      return {
        success: true,
        data: rateDtos,
        message: 'Plan rates retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to retrieve plan rates: ${error.message}`
      };
    }
  }

  // Duplicate conversion rates from one plan to another
  async duplicatePlanRates(sourcePlanId: number, targetPlanId: number): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    try {
      // Check if source plan exists
      const sourcePlan = await this.planRepo.findOne({ where: { id: sourcePlanId } });
      if (!sourcePlan) {
        throw new NotFoundException(`Source plan with ID ${sourcePlanId} not found`);
      }

      // Check if target plan exists
      const targetPlan = await this.planRepo.findOne({ where: { id: targetPlanId } });
      if (!targetPlan) {
        throw new NotFoundException(`Target plan with ID ${targetPlanId} not found`);
      }

      // Get all rates from source plan
      const sourceRates = await this.planRateRepo.find({
        where: { planId: sourcePlanId },
        relations: ['currencyGroup']
      });

      if (sourceRates.length === 0) {
        return {
          success: true,
          data: [],
          message: `No conversion rates found in source plan ${sourcePlanId} to duplicate`
        };
      }

      // Check if target plan already has rates
      const existingTargetRates = await this.planRateRepo.find({
        where: { planId: targetPlanId }
      });

      if (existingTargetRates.length > 0) {
        throw new ConflictException(`Target plan ${targetPlanId} already has conversion rates. Cannot duplicate.`);
      }

      // Create new rates for target plan
      const newRates = sourceRates.map(sourceRate => {
        return this.planRateRepo.create({
          planId: targetPlanId,
          groupId: sourceRate.groupId,
          conversionRate: sourceRate.conversionRate,
          awRate: sourceRate.awRate,
          mpRate: sourceRate.mpRate,
          isActive: sourceRate.isActive,
          notes: sourceRate.notes ? `Duplicated from plan ${sourcePlanId}: ${sourceRate.notes}` : `Duplicated from plan ${sourcePlanId}`
        });
      });

      const savedRates = await this.planRateRepo.save(newRates);
      const rateDtos = savedRates.map(rate => PlanRateResponseDto.fromEntity(rate));

      return {
        success: true,
        data: rateDtos,
        message: `Successfully duplicated ${savedRates.length} conversion rates from plan ${sourcePlanId} to plan ${targetPlanId}`
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to duplicate plan rates: ${error.message}`
      };
    }
  }
}

