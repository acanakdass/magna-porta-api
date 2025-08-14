import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { CompanyEntity } from '../company/company.entity';
import { CurrencyGroupEntity } from './currency-group.entity';

@Entity('company_currency_rates')
@Unique(['companyId', 'groupId']) // Her şirket için her grup sadece bir kez olabilir
export class CompanyCurrencyRateEntity extends BaseEntity {
    @ApiProperty({
        description: 'Company ID',
        example: 1
    })
    @Column()
    @IsNumber()
    @IsNotEmpty()
    companyId: number;

    @ApiProperty({
        description: 'Currency group ID',
        example: 1
    })
    @Column()
    @IsNumber()
    @IsNotEmpty()
    groupId: number;

    @ApiProperty({
        description: 'Conversion rate for this company and group',
        example: 0.75,
        minimum: 0
    })
    @Column('decimal', { precision: 10, scale: 4 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    conversionRate: number;

    @ApiProperty({
        description: 'Additional fee percentage',
        example: 2.5,
        required: false,
        minimum: 0,
        maximum: 100
    })
    @Column('decimal', { precision: 5, scale: 2, nullable: true, default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    feePercentage?: number;

    @ApiProperty({
        description: 'Whether this rate is active',
        example: true
    })
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({
        description: 'Notes about this rate',
        example: 'Special rate for premium customers',
        required: false
    })
    @Column({ nullable: true, type: 'text' })
    @IsOptional()
    notes?: string;

    // Relations
    @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: CompanyEntity;

    @ManyToOne(() => CurrencyGroupEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    currencyGroup: CurrencyGroupEntity;
}
