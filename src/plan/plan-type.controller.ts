import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanTypeService } from './plan-type.service';
import { CreatePlanTypeDto, UpdatePlanTypeDto, PlanTypeResponseDto } from './dtos/plan-type.dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Plan Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plan-types')
export class PlanTypeController {
  constructor(private readonly planTypeService: PlanTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan type' })
  @ApiResponse({ status: 201, description: 'Plan type created successfully', type: PlanTypeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or plan type name already exists' })
  async create(@Body() createPlanTypeDto: CreatePlanTypeDto): Promise<BaseApiResponse<PlanTypeResponseDto>> {
    return await this.planTypeService.createPlanType(createPlanTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plan types' })
  @ApiResponse({ status: 200, description: 'Plan types retrieved successfully', type: [PlanTypeResponseDto] })
  async findAll(): Promise<BaseApiResponse<PlanTypeResponseDto[]>> {
    return await this.planTypeService.getAllPlanTypes();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active plan types' })
  @ApiResponse({ status: 200, description: 'Active plan types retrieved successfully', type: [PlanTypeResponseDto] })
  async getActivePlanTypes(): Promise<BaseApiResponse<PlanTypeResponseDto[]>> {
    return await this.planTypeService.getActivePlanTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan type by ID' })
  @ApiResponse({ status: 200, description: 'Plan type retrieved successfully', type: PlanTypeResponseDto })
  @ApiResponse({ status: 404, description: 'Plan type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<PlanTypeResponseDto>> {
    return await this.planTypeService.getPlanTypeById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plan type by ID' })
  @ApiResponse({ status: 200, description: 'Plan type updated successfully', type: PlanTypeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or plan type name already exists' })
  @ApiResponse({ status: 404, description: 'Plan type not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanTypeDto: UpdatePlanTypeDto
  ): Promise<BaseApiResponse<PlanTypeResponseDto>> {
    return await this.planTypeService.updatePlanType(id, updatePlanTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan type by ID (soft delete)' })
  @ApiResponse({ status: 200, description: 'Plan type deleted successfully', type: BaseApiResponse })
  @ApiResponse({ status: 400, description: 'Bad request - plan type is being used by plans' })
  @ApiResponse({ status: 404, description: 'Plan type not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    return await this.planTypeService.softDeletePlanType(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft deleted plan type by ID' })
  @ApiResponse({ status: 200, description: 'Plan type restored successfully' })
  @ApiResponse({ status: 404, description: 'Deleted plan type not found' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<void>> {
    return await this.planTypeService.restorePlanType(id);
  }
}


