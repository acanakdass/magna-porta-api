import { ApiProperty } from '@nestjs/swagger';
import { PlanCurrencyRateEntity } from '../../entities/plan-currency-rate.entity';

export class PlanRateResponseDto {
    @ApiProperty({
        description: 'Rate ID',
        example: 1
    })
    id!: number;

    @ApiProperty({
        description: 'Plan ID',
        example: 1
    })
    planId!: number;

    @ApiProperty({
        description: 'Currency group ID',
        example: 1
    })
    groupId!: number;

    @ApiProperty({
        description: 'Conversion rate for this plan and group',
        example: 2.90
    })
    conversionRate!: number;

    @ApiProperty({
        description: 'Airwallex rate',
        example: 2.0,
        required: false
    })
    awRate?: number;

    @ApiProperty({
        description: 'Magna Porta rate',
        example: 0.90,
        required: false
    })
    mpRate?: number;

    @ApiProperty({
        description: 'Whether this rate is active',
        example: true
    })
    isActive!: boolean;

    @ApiProperty({
        description: 'Notes about this rate',
        example: 'Special rate for premium plans',
        required: false
    })
    notes?: string;

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

    static fromEntity(entity: PlanCurrencyRateEntity): PlanRateResponseDto {
        const dto = new PlanRateResponseDto();
        dto.id = entity.id!;
        dto.planId = entity.planId;
        dto.groupId = entity.groupId;
        dto.conversionRate = entity.conversionRate;
        dto.awRate = entity.awRate;
        dto.mpRate = entity.mpRate;
        dto.isActive = entity.isActive;
        dto.notes = entity.notes;
        dto.createdAt = entity.createdAt!;
        dto.updatedAt = entity.updatedAt!;
        return dto;
    }
}

