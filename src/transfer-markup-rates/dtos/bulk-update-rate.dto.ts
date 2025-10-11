import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RateUpdateDto {
  @ApiProperty({
    description: 'Rate ID to update',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Fee percentage for SHA (Shared) payment type',
    example: 2.5,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  feeShaPercentage?: number;

  @ApiProperty({
    description: 'Minimum fee for SHA (Shared) payment type',
    example: 10.00,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeShaMinimum?: number;

  @ApiProperty({
    description: 'Fee percentage for OUR payment type',
    example: 3.0,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  feeOurPercentage?: number;

  @ApiProperty({
    description: 'Minimum fee for OUR payment type',
    example: 15.00,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeOurMinimum?: number;
}

export class BulkUpdateRatesDto {
  @ApiProperty({
    description: 'Array of rate updates',
    type: [RateUpdateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateUpdateDto)
  rates: RateUpdateDto[];
}

export class BulkUpdateResponseDto {
  @ApiProperty({
    description: 'Number of rates successfully updated',
    example: 5,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of rates that failed to update',
    example: 0,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Array of successful rate IDs',
    example: [1, 2, 3, 4, 5],
  })
  successfulIds: number[];

  @ApiProperty({
    description: 'Array of failed updates with error messages',
    type: 'array',
    example: [],
  })
  failures: Array<{ id: number; error: string }>;
}

