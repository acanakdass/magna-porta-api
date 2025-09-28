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
import { PlanCurrencyService } from './plan-currency.service';
import { CreatePlanRateDto } from './dtos/create-plan-rate.dto';
import { UpdatePlanRateDto } from './dtos/update-plan-rate.dto';
import { PlanRateResponseDto } from './dtos/plan-rate-response.dto';
import { BulkPlanRateDto } from './dtos/bulk-plan-rate.dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginationDto } from '../common/models/pagination-dto';
import { PaginatedResponseDto } from '../common/models/pagination-dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Plan Currency Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plan-currency-rates')
export class PlanCurrencyController {
  constructor(private readonly planCurrencyService: PlanCurrencyService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create a new plan currency rate' })
  @ApiResponse({ status: 201, description: 'Plan currency rate created successfully', type: PlanRateResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Plan or currency group not found' })
  @ApiResponse({ status: 409, description: 'Rate already exists for this plan and group' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createPlanRateDto: CreatePlanRateDto): Promise<BaseApiResponse<PlanRateResponseDto>> {
    return await this.planCurrencyService.createPlanRate(createPlanRateDto);
  }

  @Post('bulk')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create multiple plan currency rates in bulk' })
  @ApiResponse({ status: 201, description: 'Plan currency rates created successfully', type: [PlanRateResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Plan or currency groups not found' })
  @ApiResponse({ status: 409, description: 'Some rates already exist for this plan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async bulkCreate(@Body() bulkPlanRateDto: BulkPlanRateDto): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    return await this.planCurrencyService.bulkCreatePlanRates(bulkPlanRateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plan currency rates (paginated)' })
  @ApiResponse({ status: 200, description: 'Plan currency rates retrieved successfully', type: PaginatedResponseDto })
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<PlanRateResponseDto>> {
    return await this.planCurrencyService.listPlanRatesPaginated(paginationDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all plan currency rates without pagination' })
  @ApiResponse({ status: 200, description: 'All plan currency rates retrieved successfully', type: [PlanRateResponseDto] })
  async getAllPlanRates(): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    return await this.planCurrencyService.getAllPlanRates();
  }

  @Get('plan/:planId')
  @ApiOperation({ summary: 'Get currency rates for a specific plan' })
  @ApiResponse({ status: 200, description: 'Plan currency rates retrieved successfully', type: [PlanRateResponseDto] })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanRatesByPlan(@Param('planId', ParseIntPipe) planId: number): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    return await this.planCurrencyService.getPlanRatesByPlan(planId);
  }

  @Get('plan/:planId/group/:groupId')
  @ApiOperation({ summary: 'Get plan rate for a specific group' })
  @ApiResponse({ status: 200, description: 'Plan rate retrieved successfully', type: PlanRateResponseDto })
  @ApiResponse({ status: 404, description: 'Plan rate not found' })
  async getPlanRateForGroup(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('groupId', ParseIntPipe) groupId: number
  ): Promise<BaseApiResponse<PlanRateResponseDto>> {
    return await this.planCurrencyService.getPlanRateForGroup(planId, groupId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get plan rates by group ID' })
  @ApiResponse({ status: 200, description: 'Plan rates retrieved successfully', type: [PlanRateResponseDto] })
  async getPlanRatesByGroup(@Param('groupId', ParseIntPipe) groupId: number): Promise<BaseApiResponse<PlanRateResponseDto[]>> {
    return await this.planCurrencyService.getPlanRatesByGroup(groupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan currency rate by ID' })
  @ApiResponse({ status: 200, description: 'Plan currency rate retrieved successfully', type: PlanRateResponseDto })
  @ApiResponse({ status: 404, description: 'Plan currency rate not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<PlanRateResponseDto>> {
    return await this.planCurrencyService.getPlanRateById(id);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update plan currency rate by ID' })
  @ApiResponse({ status: 200, description: 'Plan currency rate updated successfully', type: PlanRateResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Plan currency rate not found' })
  @ApiResponse({ status: 409, description: 'Rate already exists for this plan and group combination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanRateDto: UpdatePlanRateDto
  ): Promise<BaseApiResponse<PlanRateResponseDto>> {
    return await this.planCurrencyService.updatePlanRate(id, updatePlanRateDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete plan currency rate by ID' })
  @ApiResponse({ status: 204, description: 'Plan currency rate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan currency rate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    return await this.planCurrencyService.deletePlanRate(id);
  }
}

