import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanTypeEntity } from './plan-type.entity';
import { CreatePlanTypeDto, UpdatePlanTypeDto, PlanTypeResponseDto } from './dtos/plan-type.dto';
import { BaseService } from '../common/services/base.service';
import { BaseApiResponse } from '../common/dto/api-response-dto';

@Injectable()
export class PlanTypeService extends BaseService<PlanTypeEntity> {
  constructor(
    @InjectRepository(PlanTypeEntity)
    private readonly planTypeRepo: Repository<PlanTypeEntity>,
  ) {
    super(planTypeRepo);
  }

  async createPlanType(createPlanTypeDto: CreatePlanTypeDto): Promise<BaseApiResponse<PlanTypeResponseDto>> {
    // Check if plan type name already exists
    const existingPlanType = await this.planTypeRepo.findOne({
      where: { name: createPlanTypeDto.name, isDeleted: false }
    });

    if (existingPlanType) {
      throw new BadRequestException(`Plan type with name '${createPlanTypeDto.name}' already exists`);
    }

    const entity = Object.assign(new PlanTypeEntity(), createPlanTypeDto);
    const createdPlanType = await super.create(entity);

    return {
      success: true,
      message: 'Plan type created successfully',
      data: PlanTypeResponseDto.fromEntity(createdPlanType)
    } as BaseApiResponse<PlanTypeResponseDto>;
  }

  async getAllPlanTypes(): Promise<BaseApiResponse<PlanTypeResponseDto[]>> {
    const planTypes = await this.planTypeRepo.find({
      where: { isDeleted: false },
      order: { createdAt: 'ASC' }
    });

    const planTypeDtos = planTypes.map(planType => PlanTypeResponseDto.fromEntity(planType));

    return {
      success: true,
      message: 'Plan types retrieved successfully',
      data: planTypeDtos
    } as BaseApiResponse<PlanTypeResponseDto[]>;
  }

  async getActivePlanTypes(): Promise<BaseApiResponse<PlanTypeResponseDto[]>> {
    const planTypes = await this.planTypeRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { createdAt: 'ASC' }
    });

    const planTypeDtos = planTypes.map(planType => PlanTypeResponseDto.fromEntity(planType));

    return {
      success: true,
      message: 'Active plan types retrieved successfully',
      data: planTypeDtos
    } as BaseApiResponse<PlanTypeResponseDto[]>;
  }

  async getPlanTypeById(id: number): Promise<BaseApiResponse<PlanTypeResponseDto>> {
    const planType = await this.planTypeRepo.findOne({
      where: { id, isDeleted: false }
    });

    if (!planType) {
      throw new NotFoundException(`Plan type with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Plan type retrieved successfully',
      data: PlanTypeResponseDto.fromEntity(planType)
    } as BaseApiResponse<PlanTypeResponseDto>;
  }

  async updatePlanType(id: number, updatePlanTypeDto: UpdatePlanTypeDto): Promise<BaseApiResponse<PlanTypeResponseDto>> {
    const planType = await this.planTypeRepo.findOne({ where: { id, isDeleted: false } });

    if (!planType) {
      throw new NotFoundException(`Plan type with ID ${id} not found`);
    }

    // Check if new name conflicts with existing plan type
    if (updatePlanTypeDto.name && updatePlanTypeDto.name !== planType.name) {
      const existingPlanType = await this.planTypeRepo.findOne({
        where: { name: updatePlanTypeDto.name, isDeleted: false }
      });

      if (existingPlanType) {
        throw new BadRequestException(`Plan type with name '${updatePlanTypeDto.name}' already exists`);
      }
    }

    Object.assign(planType, updatePlanTypeDto);
    const updatedPlanType = await super.update(id, planType);

    return {
      success: true,
      message: 'Plan type updated successfully',
      data: PlanTypeResponseDto.fromEntity(updatedPlanType)
    } as BaseApiResponse<PlanTypeResponseDto>;
  }

  async softDeletePlanType(id: number): Promise<BaseApiResponse<void>> {
    const planType = await this.planTypeRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['plans']
    });

    if (!planType) {
      throw new NotFoundException(`Plan type with ID ${id} not found`);
    }

    // Check if any plans are using this plan type
    if (planType.plans && planType.plans.length > 0) {
      throw new BadRequestException(`Cannot delete plan type '${planType.name}' as it is being used by ${planType.plans.length} plan(s)`);
    }

    // Perform soft delete
    planType.isDeleted = true;
    await this.planTypeRepo.save(planType);

    return {
      success: true,
      message: 'Plan type deleted successfully',
      data: null
    } as BaseApiResponse<void>;
  }

  async restorePlanType(id: number): Promise<BaseApiResponse<void>> {
    const planType = await this.planTypeRepo.findOne({
      where: { id, isDeleted: true }
    });

    if (!planType) {
      throw new NotFoundException(`Deleted plan type with ID ${id} not found`);
    }

    // Restore the plan type
    planType.isDeleted = false;
    await this.planTypeRepo.save(planType);

    return {
      success: true,
      message: 'Plan type restored successfully',
      data: null
    } as BaseApiResponse<void>;
  }
}



