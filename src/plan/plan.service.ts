import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from './plan.entity';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { PlanResponseDto } from './dtos/plan-response.dto';
import { BaseService } from '../common/services/base.service';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginatedResponseDto, PaginationDto } from '../common/models/pagination-dto';
import { CompanyEntity } from '../company/company.entity';

@Injectable()
export class PlanService extends BaseService<PlanEntity> {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
  ) {
    super(planRepo);
  }

  async createPlan(createPlanDto: CreatePlanDto): Promise<BaseApiResponse<PlanResponseDto>> {
    // Check if plan name already exists
    const existingPlan = await this.planRepo.findOne({
      where: { name: createPlanDto.name }
    });

    if (existingPlan) {
      throw new BadRequestException(`Plan with name '${createPlanDto.name}' already exists`);
    }

    const entity = Object.assign(new PlanEntity(), createPlanDto);
    const createdPlan = await super.create(entity);

    const result = {
      success: true,
      message: 'Plan created successfully',
      data: PlanResponseDto.fromEntity(createdPlan)
    } as BaseApiResponse<PlanResponseDto>;

    if (!createdPlan) {
      result.success = false;
      result.message = 'Failed to create plan';
    }

    return result;
  }

  async getAllPlans(): Promise<BaseApiResponse<PlanResponseDto[]>> {
    const plans = await this.planRepo.find({
      relations: ['companies'],
      order: { level: 'ASC' as const }
    });

    const planDtos = plans.map(plan => PlanResponseDto.fromEntity(plan));

    return {
      success: true,
      message: 'Plans retrieved successfully',
      data: planDtos
    } as BaseApiResponse<PlanResponseDto[]>;
  }

  async getActivePlans(): Promise<BaseApiResponse<PlanResponseDto[]>> {
    const plans = await this.planRepo.find({
      where: { isActive: true },
      relations: ['companies'],
      order: { level: 'ASC' as const }
    });

    const planDtos = plans.map(plan => PlanResponseDto.fromEntity(plan));

    return {
      success: true,
      message: 'Active plans retrieved successfully',
      data: planDtos
    } as BaseApiResponse<PlanResponseDto[]>;
  }

  async getPlanById(id: number): Promise<BaseApiResponse<PlanResponseDto>> {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['companies']
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Plan retrieved successfully',
      data: PlanResponseDto.fromEntity(plan)
    } as BaseApiResponse<PlanResponseDto>;
  }

  async updatePlan(id: number, updatePlanDto: UpdatePlanDto): Promise<BaseApiResponse<PlanResponseDto>> {
    const plan = await this.planRepo.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Check if new name conflicts with existing plan
    if (updatePlanDto.name && updatePlanDto.name !== plan.name) {
      const existingPlan = await this.planRepo.findOne({
        where: { name: updatePlanDto.name }
      });

      if (existingPlan) {
        throw new BadRequestException(`Plan with name '${updatePlanDto.name}' already exists`);
      }
    }

    Object.assign(plan, updatePlanDto);
    const updatedPlan = await super.update(id, plan);

    return {
      success: true,
      message: 'Plan updated successfully',
      data: PlanResponseDto.fromEntity(updatedPlan)
    } as BaseApiResponse<PlanResponseDto>;
  }

  async deletePlan(id: number): Promise<BaseApiResponse<void>> {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['companies']
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Check if any companies are using this plan
    if (plan.companies && plan.companies.length > 0) {
      throw new BadRequestException(`Cannot delete plan '${plan.name}' as it is being used by ${plan.companies.length} company(ies)`);
    }

    await super.delete(id);

    return {
      success: true,
      message: 'Plan deleted successfully',
      data: undefined
    } as BaseApiResponse<void>;
  }

  async listPlansPaginated(paginationDto: PaginationDto): Promise<PaginatedResponseDto<PlanResponseDto>> {
    const result = await this.findAllWithPagination({
      ...paginationDto,
      select: [],
      relations: ['companies'],
      where: {},
      orderBy: 'level',
      order: 'ASC'
    });

    return {
      ...result,
      data: result.data.map(plan => PlanResponseDto.fromEntity(plan))
    };
  }

  async assignPlanToCompany(companyId: number, planId: number): Promise<BaseApiResponse<void>> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    if (!plan.isActive) {
      throw new BadRequestException(`Cannot assign inactive plan '${plan.name}' to company`);
    }

    company.planId = planId;
    await this.companyRepo.save(company);

    return {
      success: true,
      message: `Plan '${plan.name}' assigned to company '${company.name}' successfully`,
      data: undefined
    } as BaseApiResponse<void>;
  }

  async removePlanFromCompany(companyId: number): Promise<BaseApiResponse<void>> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    company.planId = null;
    await this.companyRepo.save(company);

    return {
      success: true,
      message: `Plan removed from company '${company.name}' successfully`,
      data: undefined
    } as BaseApiResponse<void>;
  }

  async getCompaniesByPlan(planId: number, paginationDto: PaginationDto): Promise<PaginatedResponseDto<CompanyEntity>> {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const queryBuilder = this.companyRepo.createQueryBuilder('company')
      .leftJoinAndSelect('company.plan', 'plan')
      .leftJoinAndSelect('company.users', 'users')
      .where('company.planId = :planId', { planId })
      .orderBy('company.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const companies = await queryBuilder
      .skip((paginationDto.page - 1) * paginationDto.limit)
      .take(paginationDto.limit)
      .getMany();

    return {
      data: companies,
      meta: {
        totalItems: total,
        itemsPerPage: paginationDto.limit,
        totalPages: Math.ceil(total / paginationDto.limit),
        currentPage: paginationDto.page
      }
    };
  }
}