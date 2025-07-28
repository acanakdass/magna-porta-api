import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AwTransfersService } from '../services/aw-transfers.service';
import { AwTransfersQueryDto, AwTransferCreateRequest } from '../dtos/aw-transfers-dtos';

@ApiTags('AW Transfers')
@Controller('airwallex/transfers')
@UseGuards(JwtAuthGuard)
export class AwTransfersController {
  constructor(private readonly transfersService: AwTransfersService) {}

  /**
   * Get all transfers/payouts with optional filters
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get all transfers',
    description: 'Retrieve all transfers/payouts with optional filtering and pagination'
  })
  @ApiQuery({ name: 'from_created_at', required: false, description: 'Filter from created date (ISO 8601)' })
  @ApiQuery({ name: 'to_created_at', required: false, description: 'Filter to created date (ISO 8601)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by transfer status' })
  @ApiQuery({ name: 'transfer_currency', required: false, description: 'Filter by transfer currency' })
  @ApiQuery({ name: 'short_reference_id', required: false, description: 'Filter by short reference ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page cursor' })
  @ApiQuery({ name: 'page_size', required: false, description: 'Page size (default: 100)' })
  @ApiQuery({ name: 'request_id', required: false, description: 'Filter by request ID' })
  async getTransfers(@Query() queryDto: AwTransfersQueryDto) {
    return this.transfersService.getTransfers(queryDto);
  }

  /**
   * Create a new transfer/payout
   */
  @Post('create')
  @ApiOperation({ 
    summary: 'Create transfer',
    description: 'Create a new transfer/payout with beneficiary and payer details'
  })
  async createTransfer(@Body() createDto: AwTransferCreateRequest) {
    return this.transfersService.createTransfer(createDto);
  }
} 