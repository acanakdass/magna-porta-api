import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AwTransactionsService } from '../services/aw-transactions.service';
import { AwTransactionsQueryDto } from '../dtos/aw-transactions-dtos';

@ApiTags('AW Transactions')
@Controller('airwallex/transactions')
@UseGuards(JwtAuthGuard)
export class AwTransactionsController {
  constructor(private readonly transactionsService: AwTransactionsService) {}

  /**
   * Get card transactions with optional filters
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get card transactions',
    description: 'Retrieve card transactions with optional filtering and pagination'
  })
  @ApiQuery({ name: 'billing_currency', required: false, description: 'Filter by billing currency' })
  @ApiQuery({ name: 'card_id', required: false, description: 'Filter by card ID' })
  @ApiQuery({ name: 'digital_wallet_token_id', required: false, description: 'Filter by digital wallet token ID' })
  @ApiQuery({ name: 'from_created_at', required: false, description: 'Filter from created date (ISO 8601)' })
  @ApiQuery({ name: 'to_created_at', required: false, description: 'Filter to created date (ISO 8601)' })
  @ApiQuery({ name: 'lifecycle_id', required: false, description: 'Filter by lifecycle ID' })
  @ApiQuery({ name: 'retrieval_ref', required: false, description: 'Filter by retrieval reference' })
  @ApiQuery({ name: 'transaction_type', required: false, description: 'Filter by transaction type' })
  @ApiQuery({ name: 'transaction_status', required: false, description: 'Filter by transaction status' })
  @ApiQuery({ name: 'page_num', required: false, description: 'Page number (default: 0)' })
  @ApiQuery({ name: 'page_size', required: false, description: 'Page size (default: 100)' })
  async getTransactions(@Query() queryDto: AwTransactionsQueryDto) {
    return this.transactionsService.getTransactions(queryDto);
  }
} 