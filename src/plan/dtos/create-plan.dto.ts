import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name (e.g., Bronze, Silver, Gold)',
    example: 'Gold'
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Premium plan with advanced features',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Plan level for ordering (1 = Bronze, 2 = Silver, 3 = Gold)',
    example: 3
  })
  @IsNumber()
  level!: number;

  @ApiProperty({
    description: 'Monthly price for this plan',
    example: 99.99,
    required: false
  })
  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @ApiProperty({
    description: 'Annual price for this plan',
    example: 999.99,
    required: false
  })
  @IsOptional()
  @IsNumber()
  annualPrice?: number;

  @ApiProperty({
    description: 'Maximum number of users allowed for this plan',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiProperty({
    description: 'Maximum number of transactions per month',
    example: 10000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  maxTransactionsPerMonth?: number;

  @ApiProperty({
    description: 'Whether this plan is currently active and available',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Icon name or class for the plan (e.g., "crown", "star", "diamond")',
    example: 'crown',
    required: false
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Color code for the plan (hex, rgb, or color name)',
    example: '#FFD700',
    required: false
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Plan type ID for this plan',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  planTypeId?: number;
}
