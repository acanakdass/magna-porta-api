import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class RateTemplateDto {
    @ApiProperty({
        description: 'Template name',
        example: 'Standard Rates'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Template description',
        example: 'Standard conversion rates for all companies',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Default conversion rate',
        example: 0.85,
        minimum: 0
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    defaultConversionRate: number;

    @ApiProperty({
        description: 'Default fee percentage',
        example: 2.5,
        minimum: 0,
        maximum: 100,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    defaultFeePercentage?: number;

    @ApiProperty({
        description: 'Whether this template is active',
        example: true,
        required: false
    })
    @IsOptional()
    isActive?: boolean;
}
