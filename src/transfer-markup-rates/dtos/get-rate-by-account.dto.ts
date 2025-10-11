import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class GetRateByAccountDto {
  @ApiProperty({
    description: 'Connected account ID (Airwallex account ID)',
    example: 'acc_123456789',
  })
  @IsString()
  @IsNotEmpty()
  connectedAccountId: string;

  @ApiProperty({
    description: 'Currency code (3 letters)',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Transfer method',
    enum: ['local', 'swift'],
    example: 'swift',
  })
  @IsEnum(['local', 'swift'])
  @IsNotEmpty()
  transferMethod: 'local' | 'swift';

  @ApiPropertyOptional({
    description: 'Country code (2 letters) - Required for local transfers',
    example: 'US',
  })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Transaction type (e.g., SEPA, GIRO, FAST, RTGS, ACH)',
    example: 'SEPA',
  })
  @IsString()
  @IsOptional()
  transactionType?: string;
}

