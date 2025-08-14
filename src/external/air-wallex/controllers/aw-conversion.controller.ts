import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { AwConversionService } from '../services/aw-conversion.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { 
    AwConversionsResponse, 
    AwConversionDetails, 
    AwConversionQueryDto,
    AwConversionCreateRequest,
    AwConversionCreateResponse
} from '../dtos/aw-conversion-dtos';

@ApiTags('Airwallex Conversions')
@Controller('airwallex/conversions')
// @UseGuards(JwtAuthGuard)
export class AwConversionController {

    constructor(private readonly conversionService: AwConversionService) {}

    @Get()
    @ApiOperation({ summary: 'Get all conversions for the account' })
    @ApiResponse({ 
        status: 200, 
        description: 'Conversions retrieved successfully',
        type: BaseApiResponse<AwConversionsResponse>
    })
    @ApiQuery({ name: 'buy_currency', required: false, description: 'Buy currency filter' })
    @ApiQuery({ name: 'sell_currency', required: false, description: 'Sell currency filter' })
    @ApiQuery({ name: 'from_created_at', required: false, description: 'From creation date filter' })
    @ApiQuery({ name: 'to_created_at', required: false, description: 'To creation date filter' })
    @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
    @ApiQuery({ name: 'page_num', required: false, description: 'Page number' })
    @ApiQuery({ name: 'page_size', required: false, description: 'Page size' })
    async getConversions(
        @Query() queryParams: AwConversionQueryDto,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwConversionsResponse>> {
        return await this.conversionService.getConversions(queryParams, accountId);
    }

    @Post('create')
    @ApiOperation({ summary: 'Create a new conversion' })
    @ApiResponse({ 
        status: 201, 
        description: 'Conversion created successfully',
        type: BaseApiResponse<AwConversionCreateResponse>
    })
    @ApiBody({ type: AwConversionCreateRequest })
    async createConversion(
        @Body() conversionData: AwConversionCreateRequest
    ): Promise<BaseApiResponse<AwConversionCreateResponse>> {
        return await this.conversionService.createConversion(conversionData);
    }

    @Get(':conversionId')
    @ApiOperation({ summary: 'Get conversion details by ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Conversion details retrieved successfully',
        type: BaseApiResponse<AwConversionDetails>
    })
    @ApiParam({ name: 'conversionId', description: 'Conversion ID' })
    @ApiQuery({ name: 'account_id', required: true, description: 'Account ID' })
    async getConversionById(
        @Param('conversionId') conversionId: string,
        @Query('account_id') accountId: string
    ): Promise<BaseApiResponse<AwConversionDetails>> {
        return await this.conversionService.getConversionById(accountId, conversionId);
    }
} 