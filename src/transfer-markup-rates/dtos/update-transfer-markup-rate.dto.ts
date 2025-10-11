import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Length, Min, Max } from 'class-validator';

export class UpdateTransferMarkupRateDto {
  @ApiPropertyOptional({
    description: 'Plan ID',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  planId?: number;

  @ApiPropertyOptional({
    description: 'Region for the transfer markup rate',
    example: 'Europe',
  })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  region?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'United Kingdom',
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({
    description: 'ISO country code (2 letters)',
    example: 'GB',
  })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'ISO currency code (3 letters)',
    example: 'GBP',
  })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Transaction type',
    example: 'international',
  })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  transactionType?: string;

  @ApiPropertyOptional({
    description: 'Transfer method: local or swift',
    example: 'swift',
    enum: ['local', 'swift'],
  })
  @IsEnum(['local', 'swift'])
  @IsOptional()
  transferMethod?: 'local' | 'swift';

  @ApiPropertyOptional({
    description: 'Fee percentage for SHA (Shared) payment type',
    example: 2.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  feeShaPercentage?: number;

  @ApiPropertyOptional({
    description: 'Minimum fee for SHA (Shared) payment type',
    example: 10.00,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeShaMinimum?: number;

  @ApiPropertyOptional({
    description: 'Fee percentage for OUR payment type',
    example: 3.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  feeOurPercentage?: number;

  @ApiPropertyOptional({
    description: 'Minimum fee for OUR payment type',
    example: 15.00,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeOurMinimum?: number;

  @ApiPropertyOptional({
    description: 'Currency code for fees',
    example: 'USD',
  })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  feeCurrency?: string;
}
