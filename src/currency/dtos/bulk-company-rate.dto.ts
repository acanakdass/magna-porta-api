import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsArray, ValidateNested, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyRateItemDto {
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
        description: 'Conversion rate',
        example: 0.85,
        minimum: 0
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    conversionRate: number;

    @ApiProperty({
        description: 'Fee percentage',
        example: 2.5,
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
        description: 'Notes about this rate',
        example: 'Bulk assignment',
        required: false
    })
    @IsOptional()
    notes?: string;
}

export class BulkCompanyRateDto {
    @ApiProperty({
        description: 'Array of company rates to create',
        type: [CompanyRateItemDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CompanyRateItemDto)
    rates: CompanyRateItemDto[];
}
