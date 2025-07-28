import { IsOptional, IsString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AwTransactionsQueryDto {
  @ApiPropertyOptional({ description: 'Billing currency filter' })
  @IsOptional()
  @IsString()
  billing_currency?: string;

  @ApiPropertyOptional({ description: 'Card ID filter' })
  @IsOptional()
  @IsString()
  card_id?: string;

  @ApiPropertyOptional({ description: 'Digital wallet token ID filter' })
  @IsOptional()
  @IsString()
  digital_wallet_token_id?: string;

  @ApiPropertyOptional({ description: 'From created date (ISO 8601)' })
  @IsOptional()
  @IsString()
  from_created_at?: string;

  @ApiPropertyOptional({ description: 'To created date (ISO 8601)' })
  @IsOptional()
  @IsString()
  to_created_at?: string;

  @ApiPropertyOptional({ description: 'Lifecycle ID filter' })
  @IsOptional()
  @IsString()
  lifecycle_id?: string;

  @ApiPropertyOptional({ description: 'Retrieval reference filter' })
  @IsOptional()
  @IsString()
  retrieval_ref?: string;

  @ApiPropertyOptional({ description: 'Transaction type filter' })
  @IsOptional()
  @IsString()
  transaction_type?: string;

  @ApiPropertyOptional({ description: 'Transaction status filter' })
  @IsOptional()
  @IsString()
  transaction_status?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page_num?: number = 0;

  @ApiPropertyOptional({ description: 'Page size', default: 100 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  page_size?: number = 100;
} 