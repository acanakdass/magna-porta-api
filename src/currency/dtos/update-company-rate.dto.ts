import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class UpdateCompanyRateDto {
    @ApiProperty({
        description: 'Company ID',
        example: 12
    })
    @IsNumber()
    @IsNotEmpty()
    companyId: number;

    @ApiProperty({
        description: 'Currency group ID',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    groupId: number;

    @ApiProperty({
        description: 'Conversion rate',
        example: 0.95,
        minimum: 0
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    conversionRate: number;

    @ApiProperty({
        description: 'Fee percentage',
        example: 0.00,
        minimum: 0,
        maximum: 100,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    feePercentage?: number;

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
        example: 'Major Currencies - 0.95% rate for Magna Porta SL (Verified Company)',
        required: false
    })
    @IsOptional()
    notes?: string;
}
