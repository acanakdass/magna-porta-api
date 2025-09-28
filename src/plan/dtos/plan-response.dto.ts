import { ApiProperty } from '@nestjs/swagger';
import { PlanEntity } from '../plan.entity';
import { CompanyEntity } from '../../company/company.entity';

export class PlanResponseDto {
  @ApiProperty({
    description: 'Plan ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: 'Plan name',
    example: 'Gold'
  })
  name!: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Premium plan with advanced features',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Plan level for ordering',
    example: 3
  })
  level!: number;

  @ApiProperty({
    description: 'Monthly price for this plan',
    example: 99.99,
    required: false
  })
  monthlyPrice?: number;

  @ApiProperty({
    description: 'Annual price for this plan',
    example: 999.99,
    required: false
  })
  annualPrice?: number;

  @ApiProperty({
    description: 'Maximum number of users allowed for this plan',
    example: 100,
    required: false
  })
  maxUsers?: number;

  @ApiProperty({
    description: 'Maximum number of transactions per month',
    example: 10000,
    required: false
  })
  maxTransactionsPerMonth?: number;

  @ApiProperty({
    description: 'Whether this plan is currently active and available',
    example: true
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Icon name or class for the plan',
    example: 'crown',
    required: false
  })
  icon?: string;

  @ApiProperty({
    description: 'Color code for the plan',
    example: '#FFD700',
    required: false
  })
  color?: string;

  @ApiProperty({
    description: 'Companies using this plan',
    type: [CompanyEntity],
    required: false
  })
  companies?: CompanyEntity[];

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt!: Date;

  static fromEntity(entity: PlanEntity): PlanResponseDto {
    const dto = new PlanResponseDto();
    dto.id = entity.id!;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.level = entity.level;
    dto.monthlyPrice = entity.monthlyPrice;
    dto.annualPrice = entity.annualPrice;
    dto.maxUsers = entity.maxUsers;
    dto.maxTransactionsPerMonth = entity.maxTransactionsPerMonth;
    dto.isActive = entity.isActive;
    dto.icon = entity.icon;
    dto.color = entity.color;
    dto.companies = entity.companies;
    dto.createdAt = entity.createdAt!;
    dto.updatedAt = entity.updatedAt!;
    return dto;
  }
}
