import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PlanEntity } from '../plan/plan.entity';

@Entity('transfer_markup_rates')
@Unique(['planId', 'countryCode', 'currency', 'transferMethod'])
export class TransferMarkupRateEntity extends BaseEntity {
  @ApiProperty({
    description: 'Plan ID',
    example: 1
  })
  @Column()
  @IsNumber()
  @IsNotEmpty()
  planId!: number;

  @ApiProperty({
    description: 'Geographic region',
    example: 'APAC',
    required: false
  })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Singapore',
    required: false
  })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'ISO country code',
    example: 'SG'
  })
  @Column({ name: 'country_code' })
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'SGD'
  })
  @Column()
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({
    description: 'Transaction type',
    example: 'Bank Transfer',
    required: false
  })
  @Column({ name: 'transaction_type', nullable: true })
  @IsString()
  @IsOptional()
  transactionType?: string;

  @ApiProperty({
    description: 'Transfer method',
    example: 'local',
    enum: ['local', 'swift']
  })
  @Column({ name: 'transfer_method' })
  @IsString()
  @IsNotEmpty()
  transferMethod!: 'local' | 'swift';

  @ApiProperty({
    description: 'SHA fee percentage',
    example: 0.5,
    required: false,
    minimum: 0
  })
  @Column('decimal', { 
    precision: 10, 
    scale: 3, 
    name: 'fee_sha_percentage',
    nullable: true 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeShaPercentage?: number;

  @ApiProperty({
    description: 'SHA minimum fee',
    example: 5.00,
    required: false,
    minimum: 0
  })
  @Column('decimal', { 
    precision: 10, 
    scale: 2, 
    name: 'fee_sha_minimum',
    nullable: true 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  feeShaMinimum?: number;

  @ApiProperty({
    description: 'OUR fee percentage',
    example: 0.2,
    minimum: 0
  })
  @Column('decimal', { 
    precision: 10, 
    scale: 3, 
    name: 'fee_our_percentage'
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  feeOurPercentage!: number;

  @ApiProperty({
    description: 'OUR minimum fee',
    example: 2.00,
    minimum: 0
  })
  @Column('decimal', { 
    precision: 10, 
    scale: 2, 
    name: 'fee_our_minimum'
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  feeOurMinimum!: number;

  @ApiProperty({
    description: 'Fee currency code',
    example: 'USD'
  })
  @Column({ name: 'fee_currency' })
  @IsString()
  @IsNotEmpty()
  feeCurrency!: string;

  // Relations
  @ManyToOne(() => PlanEntity, (plan) => plan.transferMarkupRates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan!: PlanEntity;
}

