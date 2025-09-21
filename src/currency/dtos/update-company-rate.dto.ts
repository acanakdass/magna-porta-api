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
        example: 'Major Currencies - 0.95% rate for Magna Porta SL (Verified Company)',
        required: false
    })
    @IsOptional()
    notes?: string;
}
