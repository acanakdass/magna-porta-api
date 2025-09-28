import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsBoolean, IsString, Min, Max } from 'class-validator';

export class CreatePlanRateDto {
    @ApiProperty({
        description: 'Plan ID',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    planId: number;

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
        minimum: 0,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    awRate?: number;

    @ApiProperty({
        description: 'Magna Porta rate (editable)',
        example: 0.90,
        minimum: 0,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    mpRate?: number;

    @ApiProperty({
        description: 'Whether this rate is active',
        example: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'Notes about this rate',
        example: 'Special rate for premium plans',
        required: false
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

