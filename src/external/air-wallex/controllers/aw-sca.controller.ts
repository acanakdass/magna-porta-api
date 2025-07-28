import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AwScaService, ScaTokenInfo } from '../services/aw-sca.service';

@ApiTags('AW SCA')
@Controller('airwallex/sca')
@UseGuards(JwtAuthGuard)
export class AwScaController {
  constructor(private readonly scaService: AwScaService) {}

  /**
   * SCA token al
   */
  @Post('token')
  @ApiOperation({ 
    summary: 'Get SCA token',
    description: 'Get a new SCA token for secure financial operations'
  })
  @ApiResponse({ status: 200, description: 'SCA token generated successfully' })
  async getScaToken(
    @Request() req: any,
    @Body() body: { accountId?: string; forceNew?: boolean }
  ): Promise<ScaTokenInfo> {
    const userId = req.user.id;
    return this.scaService.getScaToken(userId, body.accountId, body.forceNew || false);
  }

  /**
   * SCA token doğrula
   */
  @Post('validate')
  @ApiOperation({ 
    summary: 'Validate SCA token',
    description: 'Validate if the provided SCA token is still valid'
  })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateScaToken(
    @Request() req: any,
    @Body() body: { token: string }
  ): Promise<{ valid: boolean }> {
    const userId = req.user.id;
    const valid = await this.scaService.validateScaToken(body.token, userId);
    return { valid };
  }

  /**
   * SCA kurulum durumunu kontrol et
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Check SCA setup status',
    description: 'Check if SCA is properly set up for the user'
  })
  @ApiResponse({ status: 200, description: 'SCA setup status' })
  async checkScaStatus(@Request() req: any): Promise<{ setup: boolean }> {
    const userId = req.user.id;
    const setup = await this.scaService.checkScaSetupStatus(userId);
    return { setup };
  }

  /**
   * SCA token'ı sil
   */
  @Delete('token/:accountId?')
  @ApiOperation({ 
    summary: 'Clear SCA token',
    description: 'Clear SCA token from cache'
  })
  @ApiResponse({ status: 200, description: 'SCA token cleared successfully' })
  async clearScaToken(
    @Request() req: any,
    @Param('accountId') accountId?: string
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    this.scaService.clearScaToken(userId, accountId);
    return { message: 'SCA token cleared successfully' };
  }

  /**
   * Tüm SCA token'ları sil (admin only)
   */
  @Delete('tokens/all')
  @ApiOperation({ 
    summary: 'Clear all SCA tokens',
    description: 'Clear all SCA tokens from cache (admin only)'
  })
  @ApiResponse({ status: 200, description: 'All SCA tokens cleared successfully' })
  async clearAllScaTokens(): Promise<{ message: string }> {
    this.scaService.clearAllScaTokens();
    return { message: 'All SCA tokens cleared successfully' };
  }
} 