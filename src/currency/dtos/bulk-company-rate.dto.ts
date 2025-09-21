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
        description: 'Airwallex rate (default 2%)',
        example: 2.0,
        minimum: 0,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    awRate?: number;

    @ApiProperty({
        description: 'Magna Porta rate (editable)',
        example: 0.85,
        minimum: 0,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    mpRate?: number;

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
