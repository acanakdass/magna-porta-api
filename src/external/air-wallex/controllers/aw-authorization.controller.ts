import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthorizeService } from '../services/aw-authorization.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { AwAuthorizeResponse } from '../dtos/aw-auth-dtos/aw-authorization-response';

@ApiTags('Airwallex Authorization')
@Controller('airwallex/authorization')
// @UseGuards(JwtAuthGuard)
export class AwAuthorizationController {

    constructor(private readonly authorizeService: AuthorizeService) {}

    @Post('code')
    @ApiOperation({ summary: 'Get authorization code for SCA or other authentication flows' })
    @ApiResponse({ 
        status: 200, 
        description: 'Authorization code generated successfully',
        type: BaseApiResponse<AwAuthorizeResponse>
    })
    @ApiQuery({ name: 'auth_type', required: false, description: 'Authorization type (e.g., scaSetup, kyc)' })
    @ApiQuery({ name: 'account_id', required: false, description: 'Account ID for authorization' })
    async getAuthorizationCode(
        @Query('auth_type') authType?: string,
        @Query('account_id') accountId?: string
    ): Promise<BaseApiResponse<AwAuthorizeResponse>> {
        return await this.authorizeService.getAuthorizationCode(authType, accountId);
    }
} 