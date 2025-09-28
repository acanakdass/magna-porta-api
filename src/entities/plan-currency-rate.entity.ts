import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { PlanEntity } from '../plan/plan.entity';
import { CurrencyGroupEntity } from './currency-group.entity';

@Entity('plan_currency_rates')
@Unique(['planId', 'groupId']) // Her plan için her grup sadece bir kez olabilir
export class PlanCurrencyRateEntity extends BaseEntity {
    @ApiProperty({
        description: 'Plan ID',
        example: 1
    })
    @Column()
    @IsNumber()
    @IsNotEmpty()
    planId: number;

    @ApiProperty({
        description: 'Currency group ID',
        example: 1
    })
    @Column()
    @IsNumber()
    @IsNotEmpty()
    groupId: number;

    @ApiProperty({
        description: 'Conversion rate for this plan and group (calculated: awRate + mpRate)',
        example: 2.90,
        minimum: 0
    })
    @Column('decimal', { precision: 10, scale: 4 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    conversionRate: number;

    @ApiProperty({
        description: 'Airwallex rate (default 2%)',
        example: 2.0,
        minimum: 0
    })
    @Column('decimal', { precision: 5, scale: 2, default: 2, nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    awRate?: number;

    @ApiProperty({
        description: 'Magna Porta rate (editable)',
        example: 0.90,
        minimum: 0
    })
    @Column('decimal', { precision: 10, scale: 4, default: 0, nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    mpRate?: number;

    @ApiProperty({
        description: 'Whether this rate is active',
        example: true
    })
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({
        description: 'Notes about this rate',
        example: 'Special rate for premium plans',
        required: false
    })
    @Column({ nullable: true, type: 'text' })
    @IsOptional()
    notes?: string;

    // Relations
    @ManyToOne(() => PlanEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'planId' })
    plan: PlanEntity;

    @ManyToOne(() => CurrencyGroupEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    currencyGroup: CurrencyGroupEntity;
}

