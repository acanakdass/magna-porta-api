import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { CurrencySeedService } from './currency.seed';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { 
    CreateCurrencyDto, 
    CreateCurrencyGroupDto, 
    CreateCompanyRateDto,
    AssignCurrencyGroupDto,
    BulkCompanyRateDto,
    UpdateCurrencyGroupDto,
    UpdateCompanyRateDto,
    UpdateCurrencyDto
} from './dtos';
import { CreatePlanRateDto } from '../plan/dtos/create-plan-rate.dto';
import { UpdatePlanRateDto } from '../plan/dtos/update-plan-rate.dto';
import { BulkPlanRateDto } from '../plan/dtos/bulk-plan-rate.dto';
import { 
    CurrencyEntity, 
    CurrencyGroupEntity, 
    CompanyCurrencyRateEntity,
    PlanCurrencyRateEntity 
} from '../entities';

@ApiTags('Currency Management')
@Controller('currency')
//@UseGuards(JwtAuthGuard)
export class CurrencyController {
    constructor(
        private readonly currencyService: CurrencyService,
        private readonly currencySeedService: CurrencySeedService
    ) {}

    // Currency Group Endpoints
    @Post('groups')
    @ApiOperation({ summary: 'Create a new currency group' })
    @ApiResponse({ 
        status: 201, 
        description: 'Currency group created successfully',
        type: BaseApiResponse<CurrencyGroupEntity>
    })
    async createCurrencyGroup(
        @Body() createDto: CreateCurrencyGroupDto
    ): Promise<BaseApiResponse<CurrencyGroupEntity>> {
        return await this.currencyService.createCurrencyGroup(createDto);
    }

    @Get('groups')
    @ApiOperation({ summary: 'Get all currency groups' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currency groups retrieved successfully',
        type: BaseApiResponse<CurrencyGroupEntity[]>
    })
    async getAllCurrencyGroups(): Promise<BaseApiResponse<CurrencyGroupEntity[]>> {
        return await this.currencyService.getAllCurrencyGroups();
    }

    @Put('groups/:id')
    @ApiOperation({ summary: 'Update currency group and assign currencies' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currency group updated successfully',
        type: BaseApiResponse<CurrencyGroupEntity>
    })
    @ApiParam({ name: 'id', description: 'Currency group ID' })
    async updateCurrencyGroup(
        @Param('id') groupId: number,
        @Body() updateDto: UpdateCurrencyGroupDto
    ): Promise<BaseApiResponse<CurrencyGroupEntity>> {
        return await this.currencyService.updateCurrencyGroup(groupId, updateDto);
    }

    // Currency Endpoints
    @Post()
    @ApiOperation({ summary: 'Create a new currency' })
    @ApiResponse({ 
        status: 201, 
        description: 'Currency created successfully',
        type: BaseApiResponse<CurrencyEntity>
    })
    async createCurrency(
        @Body() createDto: CreateCurrencyDto
    ): Promise<BaseApiResponse<CurrencyEntity>> {
        return await this.currencyService.createCurrency(createDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update currency' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currency updated successfully',
        type: BaseApiResponse<CurrencyEntity>
    })
    @ApiResponse({
        status: 404,
        description: 'Currency or currency group not found',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Currency not found"
            }
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Currency code already exists',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Currency code already exists"
            }
        }
    })
    @ApiParam({ name: 'id', description: 'Currency ID' })
    async updateCurrency(
        @Param('id') currencyId: number,
        @Body() updateDto: UpdateCurrencyDto
    ): Promise<BaseApiResponse<CurrencyEntity>> {
        const result = await this.currencyService.updateCurrency(currencyId, updateDto);
        
        // If the service returns an error, throw an HTTP exception with proper status code
        if (!result.success) {
            if (result.message.includes('not found')) {
                throw new HttpException(result, HttpStatus.NOT_FOUND);
            } else if (result.message.includes('already exists')) {
                throw new HttpException(result, HttpStatus.CONFLICT);
            } else {
                throw new HttpException(result, HttpStatus.BAD_REQUEST);
            }
        }
        
        return result;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete currency' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currency deleted successfully',
        type: BaseApiResponse<null>
    })
    @ApiResponse({
        status: 404,
        description: 'Currency not found',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Currency not found"
            }
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Cannot delete currency that is used in company rates',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Cannot delete currency that is used in company rates"
            }
        }
    })
    @ApiParam({ name: 'id', description: 'Currency ID' })
    async deleteCurrency(
        @Param('id') currencyId: number
    ): Promise<BaseApiResponse<null>> {
        const result = await this.currencyService.deleteCurrency(currencyId);
        
        // If the service returns an error, throw an HTTP exception with proper status code
        if (!result.success) {
            if (result.message.includes('not found')) {
                throw new HttpException(result, HttpStatus.NOT_FOUND);
            } else if (result.message.includes('Cannot delete')) {
                throw new HttpException(result, HttpStatus.CONFLICT);
            } else {
                throw new HttpException(result, HttpStatus.BAD_REQUEST);
            }
        }
        
        return result;
    }

    @Get()
    @ApiOperation({ summary: 'Get all currencies' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currencies retrieved successfully',
        type: BaseApiResponse<CurrencyEntity[]>
    })
    async getAllCurrencies(): Promise<BaseApiResponse<CurrencyEntity[]>> {
        return await this.currencyService.getAllCurrencies();
    }

    @Get('group/:groupId')
    @ApiOperation({ summary: 'Get currencies by group ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currencies retrieved successfully',
        type: BaseApiResponse<CurrencyEntity[]>
    })
    @ApiParam({ name: 'groupId', description: 'Currency group ID' })
    async getCurrenciesByGroup(
        @Param('groupId') groupId: number
    ): Promise<BaseApiResponse<CurrencyEntity[]>> {
        return await this.currencyService.getCurrenciesByGroup(groupId);
    }

    // Company Rate Endpoints
    @Get('company-rates')
    @ApiOperation({ summary: 'Get all company rates with company details' })
    @ApiResponse({ 
        status: 200, 
        description: 'Company rates retrieved successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity[]>
    })
    async getAllCompanyRates(): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        return await this.currencyService.getAllCompanyRates();
    }

    @Post('company-rates')
    @ApiOperation({ summary: 'Create a new company currency rate' })
    @ApiResponse({ 
        status: 201, 
        description: 'Company rate created successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity>
    })
    async createCompanyRate(
        @Body() createDto: CreateCompanyRateDto
    ): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        return await this.currencyService.createCompanyRate(createDto);
    }

    @Put('company-rates/:id')
    @ApiOperation({ summary: 'Update company currency rate' })
    @ApiResponse({ 
        status: 200, 
        description: 'Company rate updated successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity>
    })
    @ApiResponse({
        status: 404,
        description: 'Company rate, company, or currency group not found',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Company not found"
            }
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Rate already exists for this company and group',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Rate already exists for this company and group"
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - validation failed',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Failed to update company rate: validation error"
            }
        }
    })
    @ApiParam({ name: 'id', description: 'Company rate ID' })
    async updateCompanyRate(
        @Param('id') rateId: number,
        @Body() updateDto: UpdateCompanyRateDto
    ): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        const result = await this.currencyService.updateCompanyRate(rateId, updateDto);
        
        // If the service returns an error, throw an HTTP exception with proper status code
        if (!result.success) {
            if (result.message.includes('not found')) {
                throw new HttpException(result, HttpStatus.NOT_FOUND);
            } else if (result.message.includes('already exists') || result.message.includes('Conflict')) {
                throw new HttpException(result, HttpStatus.CONFLICT);
            } else {
                throw new HttpException(result, HttpStatus.BAD_REQUEST);
            }
        }
        
        return result;
    }

    @Delete('company-rates/:id')
    @ApiOperation({ summary: 'Delete company currency rate' })
    @ApiResponse({ 
        status: 200, 
        description: 'Company rate deleted successfully',
        type: BaseApiResponse<null>
    })
    @ApiResponse({
        status: 404,
        description: 'Company rate not found',
        schema: {
            example: {
                success: false,
                data: null,
                message: "Company rate not found"
            }
        }
    })
    @ApiParam({ name: 'id', description: 'Company rate ID' })
    async deleteCompanyRate(
        @Param('id') rateId: number
    ): Promise<BaseApiResponse<null>> {
        const result = await this.currencyService.deleteCompanyRate(rateId);
        
        // If the service returns an error, throw an HTTP exception with proper status code
        if (!result.success) {
            if (result.message.includes('not found')) {
                throw new HttpException(result, HttpStatus.NOT_FOUND);
            } else {
                throw new HttpException(result, HttpStatus.BAD_REQUEST);
            }
        }
        
        return result;
    }

    @Get('company-rates/:companyId')
    @ApiOperation({ summary: 'Get all rates for a specific company' })
    @ApiResponse({ 
        status: 200, 
        description: 'Company rates retrieved successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity[]>
    })
    @ApiParam({ name: 'companyId', description: 'Company ID' })
    async getCompanyRates(
        @Param('companyId') companyId: number
    ): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        return await this.currencyService.getCompanyRates(companyId);
    }

    @Get('company-rates/:companyId/group/:groupId')
    @ApiOperation({ summary: 'Get company rate for a specific group' })
    @ApiResponse({ 
        status: 200, 
        description: 'Company rate retrieved successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity>
    })
    @ApiParam({ name: 'companyId', description: 'Company ID' })
    @ApiParam({ name: 'groupId', description: 'Currency group ID' })
    async getCompanyRateForGroup(
        @Param('companyId') companyId: number,
        @Param('groupId') groupId: number
    ): Promise<BaseApiResponse<CompanyCurrencyRateEntity>> {
        return await this.currencyService.getCompanyRateForGroup(companyId, groupId);
    }

    // Conversion Rate Endpoint
    @Get('conversion-rate/:companyId')
    @ApiOperation({ summary: 'Get conversion rate between two currencies for a company' })
    @ApiResponse({ 
        status: 200, 
        description: 'Conversion rate retrieved successfully',
        type: BaseApiResponse<{ rate: number; feePercentage: number }>
    })
    @ApiParam({ name: 'companyId', description: 'Company ID' })
    @ApiQuery({ name: 'from', description: 'Source currency code', example: 'EUR' })
    @ApiQuery({ name: 'to', description: 'Target currency code', example: 'USD' })
    async getConversionRate(
        @Param('companyId') companyId: number,
        @Query('from') fromCurrency: string,
        @Query('to') toCurrency: string
    ): Promise<BaseApiResponse<{ rate: number; awRate: number; mpRate: number }>> {
        return await this.currencyService.getConversionRate(companyId, fromCurrency, toCurrency);
    }

    // New endpoint: Get conversion rate by airwallex_account_id
    @Get('conversion-rate/airwallex/:airwallexAccountId')
    @ApiOperation({ summary: 'Get conversion rate between two currencies for a company by airwallex_account_id' })
    @ApiResponse({ 
        status: 200, 
        description: 'Conversion rate retrieved successfully',
        type: BaseApiResponse<{ 
            rate: number; 
            awRate: number; 
            mpRate: number; 
            companyId: number; 
            companyName: string;
            groupName: string;
            isCrossGroup: boolean;
            selectedGroupId: number;
        }>
    })
    @ApiParam({ name: 'airwallexAccountId', description: 'Airwallex Account ID' })
    @ApiQuery({ name: 'from', description: 'Source currency code', example: 'EUR' })
    @ApiQuery({ name: 'to', description: 'Target currency code', example: 'USD' })
    async getConversionRateByAirwallexAccount(
        @Param('airwallexAccountId') airwallexAccountId: string,
        @Query('from') fromCurrency: string,
        @Query('to') toCurrency: string
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
        return await this.currencyService.getConversionRateByAirwallexAccount(airwallexAccountId, fromCurrency, toCurrency);
    }

    // Seed endpoint for testing
    @Post('seed')
    @ApiOperation({ summary: 'Seed currency data for testing' })
    @ApiResponse({ 
        status: 201, 
        description: 'Seed data created successfully'
    })
    async seedData() {
        try {
            // Use the CurrencySeedService directly
            await this.currencySeedService.seed();
            
            return {
                success: true,
                data: null,
                message: 'Seed data created successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Failed to seed data: ${error.message}`
            };
        }
    }

    // Currency Group Assignment Endpoints
    @Post(':id/assign-group')
    @ApiOperation({ summary: 'Assign currency to a group' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currency assigned to group successfully',
        type: BaseApiResponse<CurrencyEntity>
    })
    @ApiParam({ name: 'id', description: 'Currency ID' })
    async assignCurrencyToGroup(
        @Param('id') currencyId: number,
        @Body() assignDto: AssignCurrencyGroupDto
    ): Promise<BaseApiResponse<CurrencyEntity>> {
        return await this.currencyService.assignCurrencyToGroup(currencyId, assignDto);
    }

    @Delete(':id/remove-group')
    @ApiOperation({ summary: 'Remove currency from group' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currency removed from group successfully',
        type: BaseApiResponse<CurrencyEntity>
    })
    @ApiParam({ name: 'id', description: 'Currency ID' })
    async removeCurrencyFromGroup(
        @Param('id') currencyId: number
    ): Promise<BaseApiResponse<CurrencyEntity>> {
        return await this.currencyService.removeCurrencyFromGroup(currencyId);
    }

    @Get('groups/:id/currencies')
    @ApiOperation({ summary: 'Get currencies by group ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Currencies retrieved successfully',
        type: BaseApiResponse<CurrencyEntity[]>
    })
    @ApiParam({ name: 'id', description: 'Currency group ID' })
    async getCurrenciesByGroupId(
        @Param('id') groupId: number
    ): Promise<BaseApiResponse<CurrencyEntity[]>> {
        return await this.currencyService.getCurrenciesByGroup(groupId);
    }

    // Company Rate Endpoints by Group
    @Get('company-rates/group/:groupId')
    @ApiOperation({ summary: 'Get company rates by group ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Company rates retrieved successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity[]>
    })
    @ApiParam({ name: 'groupId', description: 'Currency group ID' })
    async getCompanyRatesByGroup(
        @Param('groupId') groupId: number
    ): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        return await this.currencyService.getCompanyRatesByGroup(groupId);
    }

    // Bulk Company Rate Endpoints
    @Post('company-rates/bulk')
    @ApiOperation({ summary: 'Create bulk company rates' })
    @ApiResponse({ 
        status: 201, 
        description: 'Bulk company rates created successfully',
        type: BaseApiResponse<CompanyCurrencyRateEntity[]>
    })
    async createBulkCompanyRates(
        @Body() bulkDto: BulkCompanyRateDto
    ): Promise<BaseApiResponse<CompanyCurrencyRateEntity[]>> {
        return await this.currencyService.createBulkCompanyRates(bulkDto);
    }

    // Rate Template Endpoints
    @Get('company-rates/templates')
    @ApiOperation({ summary: 'Get rate templates' })
    @ApiResponse({ 
        status: 200, 
        description: 'Rate templates retrieved successfully',
        type: BaseApiResponse<any[]>
    })
    async getRateTemplates(): Promise<BaseApiResponse<any[]>> {
        return await this.currencyService.getRateTemplates();
    }

    // Plan Rate Endpoints
    @Get('plan-rates')
    @ApiOperation({ summary: 'Get all plan rates with plan details' })
    @ApiResponse({ 
        status: 200, 
        description: 'Plan rates retrieved successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity[]>
    })
    async getAllPlanRates(): Promise<BaseApiResponse<PlanCurrencyRateEntity[]>> {
        return await this.currencyService.getAllPlanRates();
    }

    @Post('plan-rates')
    @ApiOperation({ summary: 'Create a new plan currency rate' })
    @ApiResponse({ 
        status: 201, 
        description: 'Plan rate created successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity>
    })
    async createPlanRate(
        @Body() createDto: CreatePlanRateDto
    ): Promise<BaseApiResponse<PlanCurrencyRateEntity>> {
        return await this.currencyService.createPlanRate(createDto);
    }

    @Put('plan-rates/:id')
    @ApiOperation({ summary: 'Update plan currency rate' })
    @ApiResponse({ 
        status: 200, 
        description: 'Plan rate updated successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity>
    })
    @ApiParam({ name: 'id', description: 'Plan rate ID' })
    async updatePlanRate(
        @Param('id') rateId: number,
        @Body() updateDto: UpdatePlanRateDto
    ): Promise<BaseApiResponse<PlanCurrencyRateEntity>> {
        return await this.currencyService.updatePlanRate(rateId, updateDto);
    }

    @Delete('plan-rates/:id')
    @ApiOperation({ summary: 'Delete plan currency rate' })
    @ApiResponse({ 
        status: 200, 
        description: 'Plan rate deleted successfully',
        type: BaseApiResponse<null>
    })
    @ApiParam({ name: 'id', description: 'Plan rate ID' })
    async deletePlanRate(
        @Param('id') rateId: number
    ): Promise<BaseApiResponse<null>> {
        return await this.currencyService.deletePlanRate(rateId);
    }

    @Get('plan-rates/:planId')
    @ApiOperation({ summary: 'Get all rates for a specific plan' })
    @ApiResponse({ 
        status: 200, 
        description: 'Plan rates retrieved successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity[]>
    })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    async getPlanRates(
        @Param('planId') planId: number
    ): Promise<BaseApiResponse<PlanCurrencyRateEntity[]>> {
        return await this.currencyService.getPlanRates(planId);
    }

    @Get('plan-rates/:planId/group/:groupId')
    @ApiOperation({ summary: 'Get plan rate for a specific group' })
    @ApiResponse({ 
        status: 200, 
        description: 'Plan rate retrieved successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity>
    })
    @ApiParam({ name: 'planId', description: 'Plan ID' })
    @ApiParam({ name: 'groupId', description: 'Currency group ID' })
    async getPlanRateForGroup(
        @Param('planId') planId: number,
        @Param('groupId') groupId: number
    ): Promise<BaseApiResponse<PlanCurrencyRateEntity>> {
        return await this.currencyService.getPlanRateForGroup(planId, groupId);
    }

    // Plan Conversion Rate Endpoints
    @Get('plan-conversion-rate/airwallex/:airwallexAccountId')
    @ApiOperation({ summary: 'Get conversion rate between two currencies for a plan by airwallex_account_id' })
    @ApiResponse({ 
        status: 200, 
        description: 'Conversion rate retrieved successfully',
        type: BaseApiResponse<{ 
            rate: number; 
            awRate: number; 
            mpRate: number; 
            planId: number; 
            planName: string;
            groupName: string;
            isCrossGroup: boolean;
            selectedGroupId: number;
        }>
    })
    @ApiParam({ name: 'airwallexAccountId', description: 'Airwallex Account ID' })
    @ApiQuery({ name: 'from', description: 'Source currency code', example: 'EUR' })
    @ApiQuery({ name: 'to', description: 'Target currency code', example: 'USD' })
    async getPlanConversionRateByAirwallexAccount(
        @Param('airwallexAccountId') airwallexAccountId: string,
        @Query('from') fromCurrency: string,
        @Query('to') toCurrency: string
    ): Promise<BaseApiResponse<{ 
        rate: number; 
        awRate: number; 
        mpRate: number; 
        planId: number; 
        planName: string;
        groupName: string;
        isCrossGroup: boolean;
        selectedGroupId: number;
    }>> {
        return await this.currencyService.getPlanConversionRateByAirwallexAccount(airwallexAccountId, fromCurrency, toCurrency);
    }

    // Plan Rate Endpoints by Group
    @Get('plan-rates/group/:groupId')
    @ApiOperation({ summary: 'Get plan rates by group ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Plan rates retrieved successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity[]>
    })
    @ApiParam({ name: 'groupId', description: 'Currency group ID' })
    async getPlanRatesByGroup(
        @Param('groupId') groupId: number
    ): Promise<BaseApiResponse<PlanCurrencyRateEntity[]>> {
        return await this.currencyService.getPlanRatesByGroup(groupId);
    }

    // Bulk Plan Rate Endpoints
    @Post('plan-rates/bulk')
    @ApiOperation({ summary: 'Create bulk plan rates' })
    @ApiResponse({ 
        status: 201, 
        description: 'Bulk plan rates created successfully',
        type: BaseApiResponse<PlanCurrencyRateEntity[]>
    })
    async createBulkPlanRates(
        @Body() bulkDto: BulkPlanRateDto
    ): Promise<BaseApiResponse<PlanCurrencyRateEntity[]>> {
        return await this.currencyService.createBulkPlanRates(bulkDto);
    }
}
