import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

class PlanRateItem {
    @ApiProperty({
        description: 'Currency group ID',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    groupId: number;

    @ApiProperty({
        description: 'Conversion rate for this plan and group',
        example: 0.75,
        minimum: 0
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    conversionRate: number;

    @ApiProperty({
        description: 'Airwallex rate (default 2%)',
        example: 2.0,
        required: false
    })
    @IsNumber()
    @Min(0)
    awRate?: number;

    @ApiProperty({
        description: 'Magna Porta rate (editable)',
        example: 0.90,
        required: false
    })
    @IsNumber()
    @Min(0)
    mpRate?: number;
}

export class BulkPlanRateDto {
    @ApiProperty({
        description: 'Plan ID',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    planId: number;

    @ApiProperty({
        description: 'Array of currency rates for different groups',
        type: [PlanRateItem]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlanRateItem)
    rates: PlanRateItem[];
}

