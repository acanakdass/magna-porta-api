import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AwAccountService } from '../services/aw-account.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { AwAccountCreationRequest } from '../dtos/aw-account-dtos/aw-account-creation-request';
import { AwAccountCreationResponse } from '../dtos/aw-account-dtos/aw-account-creation-response';

@ApiTags('Airwallex Accounts')
@Controller('airwallex/accounts')
// @UseGuards(JwtAuthGuard)
export class AwAccountController {

    constructor(private readonly accountService: AwAccountService) {}

    @Post('create')
    @ApiOperation({ summary: 'Create a new Airwallex account' })
    @ApiResponse({ 
        status: 201, 
        description: 'Account created successfully',
        type: BaseApiResponse<AwAccountCreationResponse>
    })
    @ApiBody({ type: AwAccountCreationRequest })
    async createAccount(
        @Body() accountData: AwAccountCreationRequest
    ): Promise<BaseApiResponse<AwAccountCreationResponse>> {
        try {
            const result = await this.accountService.createAccount(accountData);
            return {
                success: true,
                data: result,
                message: 'Account created successfully'
            } as BaseApiResponse<AwAccountCreationResponse>;
        } catch (error: any) {
            return {
                success: false,
                data: null,
                message: `Failed to create account: ${error.message}`
            } as BaseApiResponse<AwAccountCreationResponse>;
        }
    }

    @Get(':accountId')
    @ApiOperation({ summary: 'Get account details by ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Account details retrieved successfully',
        type: BaseApiResponse<any>
    })
    @ApiParam({ name: 'accountId', description: 'Account ID' })
    async getAccount(
        @Param('accountId') accountId: string
    ): Promise<BaseApiResponse<any>> {
        try {
            const result = await this.accountService.getAccount(accountId);
            return {
                success: true,
                data: result,
                message: 'Account details retrieved successfully'
            } as BaseApiResponse<any>;
        } catch (error: any) {
            return {
                success: false,
                data: null,
                message: `Failed to retrieve account details: ${error.message}`
            } as BaseApiResponse<any>;
        }
    }
} 