import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { AwGlobalAccountService } from '../services/aw-global-account.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { 
    AwGlobalAccountsResponse,
    AwGlobalAccountCreateRequest,
    AwGlobalAccountCreateResponse,
    AwGlobalAccountDetail
} from '../dtos/aw-global-account-dtos';

@ApiTags('Airwallex Global Accounts')
@Controller('airwallex/global-accounts')
// @UseGuards(JwtAuthGuard)
export class AwGlobalAccountController {

    constructor(private readonly globalAccountService: AwGlobalAccountService) {}

    @Get()
    @ApiOperation({ summary: 'Get all global accounts for the account' })
    @ApiResponse({ 
        status: 200, 
        description: 'Global accounts retrieved successfully',
        type: BaseApiResponse<AwGlobalAccountsResponse>
    })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID to query global accounts for' })
    async getGlobalAccounts(
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwGlobalAccountsResponse>> {
        return await this.globalAccountService.getGlobalAccounts(accountId);
    }

    @Post('create')
    @ApiOperation({ summary: 'Create a new global account' })
    @ApiResponse({ 
        status: 201, 
        description: 'Global account created successfully',
        type: BaseApiResponse<AwGlobalAccountCreateResponse>
    })
    @ApiBody({ type: AwGlobalAccountCreateRequest })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID for the global account creation' })
    async createGlobalAccount(
        @Body() globalAccountData: AwGlobalAccountCreateRequest,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwGlobalAccountCreateResponse>> {
        return await this.globalAccountService.createGlobalAccount(globalAccountData, accountId);
    }

    @Get(':globalAccountId')
    @ApiOperation({ summary: 'Get global account details by ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Global account details retrieved successfully',
        type: BaseApiResponse<AwGlobalAccountDetail>
    })
    @ApiParam({ name: 'globalAccountId', description: 'Global Account ID' })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID' })
    async getGlobalAccountById(
        @Param('globalAccountId') globalAccountId: string,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwGlobalAccountDetail>> {
        return await this.globalAccountService.getGlobalAccountById(globalAccountId, accountId);
    }
} 