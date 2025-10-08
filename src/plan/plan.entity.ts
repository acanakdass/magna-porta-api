import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CompanyEntity } from '../company/company.entity';
import { PlanCurrencyRateEntity } from '../entities/plan-currency-rate.entity';
import { PlanTypeEntity } from './plan-type.entity';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plans')
export class PlanEntity extends BaseEntity {
  @ApiProperty({
    description: 'Plan name (e.g., Bronze, Silver, Gold)',
    example: 'Gold'
  })
  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Premium plan with advanced features',
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Plan level for ordering (1 = Bronze, 2 = Silver, 3 = Gold)',
    example: 3
  })
  @Column({ default: 1 })
  @IsNumber()
  level!: number;

  @ApiProperty({
    description: 'Monthly price for this plan',
    example: 99.99,
    required: false
  })
  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null
    }
  })
  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @ApiProperty({
    description: 'Annual price for this plan',
    example: 999.99,
    required: false
  })
  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value ? parseFloat(value) : null
    }
  })
  @IsOptional()
  @IsNumber()
  annualPrice?: number;

  @ApiProperty({
    description: 'Maximum number of users allowed for this plan',
    example: 100,
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiProperty({
    description: 'Maximum number of transactions per month',
    example: 10000,
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  maxTransactionsPerMonth?: number;

  @ApiProperty({
    description: 'Whether this plan is currently active and available',
    example: true
  })
  @Column({ default: true })
  isActive!: boolean;

  @ApiProperty({
    description: 'Icon name or class for the plan (e.g., "crown", "star", "diamond")',
    example: 'crown',
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Color code for the plan (hex, rgb, or color name)',
    example: '#FFD700',
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Plan type ID for this plan',
    example: 1,
    required: false
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  planTypeId?: number;

  @ApiProperty({
    description: 'Plan type relationship',
    type: () => PlanTypeEntity,
    required: false
  })
  @ManyToOne(() => PlanTypeEntity, (planType) => planType.plans, { nullable: true })
  @JoinColumn({ name: 'planTypeId' })
  planType?: PlanTypeEntity;

  // Relations
  @OneToMany(() => CompanyEntity, (company) => company.plan)
  companies!: CompanyEntity[];

  @OneToMany(() => PlanCurrencyRateEntity, (rate) => rate.plan)
  currencyRates!: PlanCurrencyRateEntity[];
}
