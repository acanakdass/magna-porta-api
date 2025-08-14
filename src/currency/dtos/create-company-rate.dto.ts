import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsBoolean, IsString, Min, Max } from 'class-validator';

export class CreateCompanyRateDto {
    @ApiProperty({
        description: 'Company ID',
        example: 1
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
        description: 'Conversion rate for this company and group',
        example: 0.75,
        minimum: 0
    })
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
        example: 'Special rate for premium customers',
        required: false
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
