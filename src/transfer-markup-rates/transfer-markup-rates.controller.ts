import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, ParseEnumPipe } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TransferMarkupRatesService } from './transfer-markup-rates.service';
import { TransferMarkupRateEntity } from '../entities/transfer-markup-rate.entity';
import { CreateTransferMarkupRateDto } from './dtos/create-transfer-markup-rate.dto';
import { UpdateTransferMarkupRateDto } from './dtos/update-transfer-markup-rate.dto';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { PaginatedResponseDto, PaginationDto } from '../common/models/pagination-dto';
import {
  GroupedRatesResponseDto,
  PlanRatesSummaryDto,
} from './dtos/grouped-rate-response.dto';
import {
  BulkUpdateRatesDto,
  BulkUpdateResponseDto,
} from './dtos/bulk-update-rate.dto';
import { GetRateByAccountDto } from './dtos/get-rate-by-account.dto';

@ApiTags('Transfer Markup Rates')
@Controller('transfer-markup-rates')
export class TransferMarkupRatesController {
  constructor(private readonly service: TransferMarkupRatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transfer markup rates with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates fetched successfully',
    type: TransferMarkupRateEntity,
    isArray: true,
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<BaseApiResponse<PaginatedResponseDto<TransferMarkupRateEntity>>> {
    const result = await this.service.findAllWithPagination({
      ...paginationDto,
      relations: [],
      where: { isDeleted: false },
    });
    return {
      success: true,
      message: 'Transfer markup rates fetched successfully',
      data: result,
    };
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated transfer markup rates' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates fetched successfully',
  })
  async findAllPaginated(
    @Query() paginationDto: PaginationDto,
  ): Promise<BaseApiResponse<PaginatedResponseDto<TransferMarkupRateEntity>>> {
    const result = await this.service.listTransferMarkupRatesPaginated({
      ...paginationDto,
    });
    return {
      success: true,
      message: 'Transfer markup rates fetched successfully',
      data: result,
    };
  }

  @Get('country/:countryCode')
  @ApiOperation({ summary: 'Get transfer markup rates by country code' })
  @ApiParam({ name: 'countryCode', description: 'ISO country code (2 letters)', example: 'GB' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates fetched successfully',
    type: TransferMarkupRateEntity,
    isArray: true,
  })
  async findByCountryCode(
    @Param('countryCode') countryCode: string,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    const rates = await this.service.findByCountryCode(countryCode.toUpperCase());
    return {
      success: true,
      message: `Transfer markup rates for country ${countryCode} fetched successfully`,
      data: rates,
    };
  }

  @Get('currency/:currency')
  @ApiOperation({ summary: 'Get transfer markup rates by currency' })
  @ApiParam({ name: 'currency', description: 'ISO currency code (3 letters)', example: 'USD' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates fetched successfully',
    type: TransferMarkupRateEntity,
    isArray: true,
  })
  async findByCurrency(
    @Param('currency') currency: string,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    const rates = await this.service.findByCurrency(currency.toUpperCase());
    return {
      success: true,
      message: `Transfer markup rates for currency ${currency} fetched successfully`,
      data: rates,
    };
  }

  @Get('transfer-method/:method')
  @ApiOperation({ summary: 'Get transfer markup rates by transfer method' })
  @ApiParam({ name: 'method', description: 'Transfer method', enum: ['local', 'swift'] })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates fetched successfully',
    type: TransferMarkupRateEntity,
    isArray: true,
  })
  async findByTransferMethod(
    @Param('method') method: 'local' | 'swift',
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    const rates = await this.service.findByTransferMethod(method);
    return {
      success: true,
      message: `Transfer markup rates for ${method} method fetched successfully`,
      data: rates,
    };
  }

  /**
   * ============================================
   * BACKOFFICE MANAGEMENT ENDPOINTS
   * ============================================
   */

  @Get('plans-summary')
  @ApiOperation({ 
    summary: 'Get summary of all plans with their rate counts',
    description: 'Returns a summary of all plans including total rates, local/swift breakdown, and coverage statistics'
  })
  @ApiResponse({
    status: 200,
    description: 'Plans summary retrieved successfully',
    type: [PlanRatesSummaryDto],
  })
  async getPlansSummary(): Promise<BaseApiResponse<PlanRatesSummaryDto[]>> {
    return this.service.getPlansSummary();
  }

  @Get('grouped/:planId')
  @ApiOperation({ 
    summary: 'Get grouped rates for a specific plan',
    description: 'Returns rates grouped by Region > Country > Currency > Transaction Type > Transfer Method for easy management'
  })
  @ApiParam({ name: 'planId', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Grouped rates retrieved successfully',
    type: GroupedRatesResponseDto,
  })
  async getGroupedRates(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<BaseApiResponse<GroupedRatesResponseDto>> {
    return this.service.getGroupedRates(planId);
  }

  @Get('filtered')
  @ApiOperation({ 
    summary: 'Get filtered rates with flexible criteria',
    description: 'Flexible filtering for management. Filter by plan, region, country, currency, or transfer method'
  })
  @ApiQuery({ name: 'planId', required: false, description: 'Filter by plan ID', example: 1, type: Number })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region', example: 'APAC' })
  @ApiQuery({ name: 'countryCode', required: false, description: 'Filter by country code', example: 'SG' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency', example: 'USD' })
  @ApiQuery({ name: 'transferMethod', required: false, enum: ['local', 'swift'], description: 'Filter by transfer method' })
  @ApiResponse({
    status: 200,
    description: 'Filtered rates retrieved successfully',
    type: [TransferMarkupRateEntity],
  })
  async getFilteredRates(
    @Query('planId') planIdStr?: string,
    @Query('region') region?: string,
    @Query('countryCode') countryCode?: string,
    @Query('currency') currency?: string,
    @Query('transferMethod') transferMethod?: 'local' | 'swift',
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    // Parse planId manually to handle optional parameter properly
    const planId = planIdStr ? parseInt(planIdStr, 10) : undefined;
    
    if (planIdStr && isNaN(planId!)) {
      return {
        success: false,
        message: 'Invalid planId parameter. Must be a number.',
        data: null,
      };
    }
    
    return this.service.getFilteredRates(planId, region, countryCode, currency, transferMethod);
  }

  @Get('regions')
  @ApiOperation({ 
    summary: 'Get available regions',
    description: 'Returns list of all unique regions in the system'
  })
  @ApiResponse({
    status: 200,
    description: 'Available regions retrieved successfully',
    type: [String],
  })
  async getAvailableRegions(): Promise<BaseApiResponse<string[]>> {
    return this.service.getAvailableRegions();
  }

  @Get('countries')
  @ApiOperation({ 
    summary: 'Get available countries',
    description: 'Returns list of all unique countries. Optionally filter by region'
  })
  @ApiQuery({ 
    name: 'region', 
    description: 'Filter by region', 
    required: false,
    example: 'APAC'
  })
  @ApiResponse({
    status: 200,
    description: 'Available countries retrieved successfully',
  })
  async getAvailableCountries(
    @Query('region') region?: string,
  ): Promise<BaseApiResponse<Array<{ code: string; name: string; region: string }>>> {
    return this.service.getAvailableCountries(region);
  }

  @Get('by-account')
  @ApiOperation({ 
    summary: 'Get transfer markup rate by connected account ID',
    description: 'Finds the company by connected account ID (airwallex_account_id), retrieves its plan, and returns the appropriate transfer markup rate based on transfer criteria'
  })
  @ApiQuery({ name: 'connectedAccountId', description: 'Connected account ID (Airwallex account ID)', example: 'acc_123456789' })
  @ApiQuery({ name: 'currency', description: 'ISO currency code (3 letters)', example: 'USD' })
  @ApiQuery({ name: 'transferMethod', description: 'Transfer method', enum: ['local', 'swift'], example: 'swift' })
  @ApiQuery({ name: 'countryCode', description: 'ISO country code (2 letters) - Required for local transfers', example: 'US', required: false })
  @ApiQuery({ name: 'transactionType', description: 'Transaction type (e.g., SEPA, GIRO, FAST, RTGS, ACH)', example: 'SEPA', required: false })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rate fetched successfully',
    type: TransferMarkupRateEntity,
  })
  async getRateByConnectedAccount(
    @Query('connectedAccountId') connectedAccountId: string,
    @Query('currency') currency: string,
    @Query('transferMethod') transferMethod: 'local' | 'swift',
    @Query('countryCode') countryCode?: string,
    @Query('transactionType') transactionType?: string,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity | null>> {
    const dto: GetRateByAccountDto = {
      connectedAccountId,
      currency,
      transferMethod,
      countryCode,
      transactionType,
    };

    return this.service.getRateByConnectedAccount(dto);
  }

  @Get('specific-rate')
  @ApiOperation({ summary: 'Get specific rate by plan, country, currency and transfer method' })
  @ApiQuery({ name: 'planId', description: 'Plan ID', example: 1 })
  @ApiQuery({ name: 'countryCode', description: 'ISO country code (2 letters)', example: 'GB' })
  @ApiQuery({ name: 'currency', description: 'ISO currency code (3 letters)', example: 'USD' })
  @ApiQuery({ name: 'transferMethod', description: 'Transfer method', enum: ['local', 'swift'] })
  @ApiResponse({
    status: 200,
    description: 'Specific transfer markup rate fetched successfully',
    type: TransferMarkupRateEntity,
  })
  async findSpecificRate(
    @Query('planId', ParseIntPipe) planId: number,
    @Query('countryCode') countryCode: string,
    @Query('currency') currency: string,
    @Query('transferMethod') transferMethod: 'local' | 'swift',
  ): Promise<BaseApiResponse<TransferMarkupRateEntity | null>> {
    const rate = await this.service.findSpecificRate(
      planId,
      countryCode.toUpperCase(),
      currency.toUpperCase(),
      transferMethod,
    );
    
    if (!rate) {
      return {
        success: false,
        message: 'Transfer markup rate not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Transfer markup rate fetched successfully',
      data: rate,
    };
  }

  @Get('plan/:planId')
  @ApiOperation({ summary: 'Get all transfer markup rates for a specific plan' })
  @ApiParam({ name: 'planId', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates for the plan fetched successfully',
    type: TransferMarkupRateEntity,
    isArray: true,
  })
  async getRatesByPlan(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity[]>> {
    return this.service.getRatesByPlan(planId);
  }

  @Get('plan/:planId/paginated')
  @ApiOperation({ summary: 'Get paginated transfer markup rates for a specific plan' })
  @ApiParam({ name: 'planId', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rates for the plan fetched successfully',
  })
  async getRatesByPlanPaginated(
    @Param('planId', ParseIntPipe) planId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<BaseApiResponse<PaginatedResponseDto<TransferMarkupRateEntity>>> {
    const result = await this.service.getRatesByPlanPaginated(planId, paginationDto);
    return {
      success: true,
      message: `Transfer markup rates for plan ${planId} fetched successfully`,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer markup rate by ID' })
  @ApiParam({ name: 'id', description: 'Transfer markup rate ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rate fetched successfully',
    type: TransferMarkupRateEntity,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    const rate = await this.service.findOneDynamic({
      id,
      isDeleted: false,
    });
    
    if (!rate) {
      return {
        success: false,
        message: `Transfer markup rate with ID ${id} not found`,
        data: null,
      };
    }

    return {
      success: true,
      message: 'Transfer markup rate fetched successfully',
      data: rate,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transfer markup rate' })
  @ApiResponse({
    status: 201,
    description: 'Transfer markup rate created successfully',
    type: TransferMarkupRateEntity,
  })
  async create(
    @Body() createDto: CreateTransferMarkupRateDto,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    return this.service.createTransferMarkupRate(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transfer markup rate' })
  @ApiParam({ name: 'id', description: 'Transfer markup rate ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rate updated successfully',
    type: TransferMarkupRateEntity,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransferMarkupRateDto,
  ): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    return this.service.updateTransferMarkupRate(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete transfer markup rate' })
  @ApiParam({ name: 'id', description: 'Transfer markup rate ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rate deleted successfully',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    return this.service.softDeleteTransferMarkupRate(id);
  }

  @Patch('bulk-update')
  @ApiOperation({ 
    summary: 'Bulk update multiple rates',
    description: 'Update multiple transfer markup rates in a single request. Useful for bulk editing operations'
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk update completed',
    type: BulkUpdateResponseDto,
  })
  async bulkUpdateRates(
    @Body() bulkUpdateDto: BulkUpdateRatesDto,
  ): Promise<BaseApiResponse<BulkUpdateResponseDto>> {
    return this.service.bulkUpdateRates(bulkUpdateDto);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted transfer markup rate' })
  @ApiParam({ name: 'id', description: 'Transfer markup rate ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer markup rate restored successfully',
  })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<TransferMarkupRateEntity>> {
    return this.service.restoreTransferMarkupRate(id);
  }
}
