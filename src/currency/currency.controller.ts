import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { CurrencySeedService } from './currency.seed';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../common/dto/api-response-dto';
import { 
    CreateCurrencyDto, 
    CreateCurrencyGroupDto, 
    CreateCompanyRateDto 
} from './dtos';
import { 
    CurrencyEntity, 
    CurrencyGroupEntity, 
    CompanyCurrencyRateEntity 
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
    ): Promise<BaseApiResponse<{ rate: number; feePercentage: number }>> {
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
            feePercentage: number; 
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
        feePercentage: number; 
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
}
