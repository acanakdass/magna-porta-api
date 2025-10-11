import { ApiProperty } from '@nestjs/swagger';
import { TransferMarkupRateEntity } from '../../entities/transfer-markup-rate.entity';

/**
 * Transfer method rates (local/swift) grouped together
 */
export class TransferMethodRatesDto {
  @ApiProperty({
    description: 'Local transfer rates',
    type: [TransferMarkupRateEntity],
    required: false,
  })
  local?: TransferMarkupRateEntity[];

  @ApiProperty({
    description: 'SWIFT transfer rates',
    type: [TransferMarkupRateEntity],
    required: false,
  })
  swift?: TransferMarkupRateEntity[];
}

/**
 * Currency rates grouped by transaction types
 */
export class CurrencyRatesDto {
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currency!: string;

  @ApiProperty({
    description: 'Rates grouped by transaction type',
    example: {
      'Bank Transfer': {
        local: [{ id: 1, feeOurPercentage: 0.2, feeOurMinimum: 2.00 }],
      },
      'ACH': {
        local: [{ id: 2, feeOurPercentage: 0.2, feeOurMinimum: 2.00 }],
      },
    },
  })
  transactionTypes!: Record<string, TransferMethodRatesDto>;
}

/**
 * Country rates grouped by currencies
 */
export class CountryRatesDto {
  @ApiProperty({ description: 'Country code', example: 'US' })
  countryCode!: string;

  @ApiProperty({ description: 'Country name', example: 'United States' })
  countryName!: string;

  @ApiProperty({ description: 'Region', example: 'North America' })
  region!: string;

  @ApiProperty({
    description: 'Rates grouped by currency',
    type: [CurrencyRatesDto],
  })
  currencies!: CurrencyRatesDto[];
}

/**
 * Region rates grouped by countries
 */
export class RegionRatesDto {
  @ApiProperty({ description: 'Region name', example: 'APAC' })
  region!: string;

  @ApiProperty({
    description: 'Countries in this region',
    type: [CountryRatesDto],
  })
  countries!: CountryRatesDto[];
}

/**
 * Complete grouped rates response for a plan
 */
export class GroupedRatesResponseDto {
  @ApiProperty({ description: 'Plan ID', example: 1 })
  planId!: number;

  @ApiProperty({ description: 'Plan name', example: 'Premium' })
  planName!: string;

  @ApiProperty({ description: 'Plan level', example: 1 })
  planLevel!: number;

  @ApiProperty({
    description: 'Rates grouped by region',
    type: [RegionRatesDto],
  })
  regions!: RegionRatesDto[];

  @ApiProperty({ description: 'Total rates count' })
  totalRates!: number;

  @ApiProperty({ description: 'Local rates count' })
  localRatesCount!: number;

  @ApiProperty({ description: 'SWIFT rates count' })
  swiftRatesCount!: number;
}

/**
 * Summary of all plans with their rate counts
 */
export class PlanRatesSummaryDto {
  @ApiProperty({ description: 'Plan ID', example: 1 })
  planId!: number;

  @ApiProperty({ description: 'Plan name', example: 'Premium' })
  planName!: string;

  @ApiProperty({ description: 'Plan level', example: 1 })
  planLevel!: number;

  @ApiProperty({ description: 'Total rates count' })
  totalRates!: number;

  @ApiProperty({ description: 'Local rates count' })
  localRates!: number;

  @ApiProperty({ description: 'SWIFT rates count' })
  swiftRates!: number;

  @ApiProperty({ description: 'Countries covered' })
  countriesCount!: number;

  @ApiProperty({ description: 'Regions covered' })
  regionsCount!: number;
}


