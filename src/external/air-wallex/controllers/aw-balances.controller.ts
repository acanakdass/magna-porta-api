import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BalanceService } from '../services/aw-balances.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { AwBalancesResponse } from '../dtos/aw-balance-dtos/aw-balances-response';

@ApiTags('Airwallex Balances')
@Controller('airwallex/balances')
// @UseGuards(JwtAuthGuard)
export class AwBalancesController {

    constructor(private readonly balanceService: BalanceService) {}

    @Get('current')
    @ApiOperation({ summary: 'Get current balances for the account' })
    @ApiResponse({ 
        status: 200, 
        description: 'Balances retrieved successfully',
        type: BaseApiResponse<AwBalancesResponse>
    })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID to query balances for' })
    @ApiQuery({ name: 'sca_token_5m', required: false, description: 'SCA token with 5-min validity' })
    async getCurrentBalances(
        @Query('account_id') accountId?: string,
        @Query('sca_token_5m') scaToken5m?: string
    ): Promise<BaseApiResponse<AwBalancesResponse>> {
        return await this.balanceService.getBalances(accountId, scaToken5m);
    }
} 