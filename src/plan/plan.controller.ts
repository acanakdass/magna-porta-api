import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { PlanTypeService } from './plan-type.service';
import { PlanSeedService } from './plan.seed';
import { PlanTypeSeedService } from './plan-type.seed';
import { PlanCurrencySeedService } from './plan-currency.seed';
import { CreatePlanDto } from './dtos/create-plan.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { PlanResponseDto } from './dtos/plan-response.dto';
import { UpdateCompanyPlanDto } from './dtos/update-company-plan.dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginationDto } from '../common/models/pagination-dto';
import { PaginatedResponseDto } from '../common/models/pagination-dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CompanyEntity } from '../company/company.entity';

@ApiTags('Plans')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly planTypeService: PlanTypeService,
    private readonly planSeedService: PlanSeedService,
    private readonly planTypeSeedService: PlanTypeSeedService,
    private readonly planCurrencySeedService: PlanCurrencySeedService
  ) {}

  @Post()
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully', type: PlanResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or plan name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createPlanDto: CreatePlanDto): Promise<BaseApiResponse<PlanResponseDto>> {
    return await this.planService.createPlan(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans (paginated)' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully', type: PaginatedResponseDto })
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<PlanResponseDto>> {
    return await this.planService.listPlansPaginated(paginationDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active plans' })
  @ApiResponse({ status: 200, description: 'Active plans retrieved successfully', type: [PlanResponseDto] })
  async getActivePlans(): Promise<BaseApiResponse<PlanResponseDto[]>> {
    return await this.planService.getActivePlans();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all plans without pagination' })
  @ApiResponse({ status: 200, description: 'All plans retrieved successfully', type: [PlanResponseDto] })
  async getAllPlans(): Promise<BaseApiResponse<PlanResponseDto[]>> {
    return await this.planService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<PlanResponseDto>> {
    return await this.planService.getPlanById(id);
  }

  @Patch(':id')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Update plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully', type: PlanResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or plan name already exists' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto
  ): Promise<BaseApiResponse<PlanResponseDto>> {
    return await this.planService.updatePlan(id, updatePlanDto);
  }

  @Delete(':id')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Delete plan by ID (soft delete)' })
  @ApiResponse({ status: 200, description: 'Plan soft deleted successfully', type: BaseApiResponse })
  @ApiResponse({ status: 400, description: 'Bad request - plan is being used by companies' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    return await this.planService.softDeletePlan(id);
  }

  @Delete(':id/soft')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Soft delete plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan soft deleted successfully', type: BaseApiResponse })
  @ApiResponse({ status: 400, description: 'Bad request - plan is being used by companies' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    return await this.planService.softDeletePlan(id);
  }

  @Patch(':id/restore')
  @Roles('administrator', 'super_admin')
  @ApiOperation({ summary: 'Restore soft deleted plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan restored successfully' })
  @ApiResponse({ status: 404, description: 'Deleted plan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    return await this.planService.restorePlan(id);
  }

  @Get(':id/companies')
  @ApiOperation({ summary: 'Get companies using a specific plan' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully', type: PaginatedResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getCompaniesByPlan(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponseDto<CompanyEntity>> {
    return await this.planService.getCompaniesByPlan(id, paginationDto);
  }

  // Seed endpoints for testing
  @Post('seed')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Seed plan data for testing' })
  @ApiResponse({ status: 201, description: 'Plan seed data created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async seedPlans(): Promise<BaseApiResponse<void>> {
    try {
      await this.planSeedService.seed();
      
      return {
        success: true,
        data: undefined,
        message: 'Plan seed data created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: `Failed to seed plan data: ${error.message}`
      };
    }
  }

  @Post('seed/plan-types')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Seed plan type data for testing' })
  @ApiResponse({ status: 201, description: 'Plan type seed data created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async seedPlanTypes(): Promise<BaseApiResponse<void>> {
    try {
      await this.planTypeSeedService.seed();
      
      return {
        success: true,
        data: undefined,
        message: 'Plan type seed data created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: `Failed to seed plan type data: ${error.message}`
      };
    }
  }

  @Post('seed/clear')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Clear all plan data' })
  @ApiResponse({ status: 200, description: 'Plan data cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async clearPlans(): Promise<BaseApiResponse<void>> {
    try {
      await this.planSeedService.clear();
      
      return {
        success: true,
        data: undefined,
        message: 'Plan data cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: `Failed to clear plan data: ${error.message}`
      };
    }
  }

  @Post('currency-rates/seed')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Seed plan currency rate data for testing' })
  @ApiResponse({ status: 201, description: 'Plan currency rate seed data created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async seedPlanCurrencyRates(): Promise<BaseApiResponse<void>> {
    try {
      await this.planCurrencySeedService.seed();
      
      return {
        success: true,
        data: undefined,
        message: 'Plan currency rate seed data created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: `Failed to seed plan currency rate data: ${error.message}`
      };
    }
  }
}

@ApiTags('Company Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies/:companyId/plan')
export class CompanyPlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Assign plan to company' })
  @ApiResponse({ status: 201, description: 'Plan assigned to company successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - plan not found or inactive' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async assignPlan(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() updateCompanyPlanDto: UpdateCompanyPlanDto
  ): Promise<BaseApiResponse<void>> {
    return await this.planService.assignPlanToCompany(companyId, updateCompanyPlanDto.planId);
  }

  @Delete()
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove plan from company' })
  @ApiResponse({ status: 204, description: 'Plan removed from company successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async removePlan(@Param('companyId', ParseIntPipe) companyId: number): Promise<BaseApiResponse<void>> {
    return await this.planService.removePlanFromCompany(companyId);
  }
}