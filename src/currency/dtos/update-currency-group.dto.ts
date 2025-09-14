import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class UpdateCurrencyGroupDto {
    @ApiProperty({
        description: 'Group name',
        example: 'Major Currencies'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Group description',
        example: 'AUD, CAD, EUR, GBP, HKD, JPY, NZD, SGD, USD',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Whether the group is active',
        example: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'Array of selected currency IDs',
        example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 13, 10, 11],
        type: [Number]
    })
    @IsArray()
    @IsNumber({}, { each: true })
    selectedCurrencies: number[];
}
