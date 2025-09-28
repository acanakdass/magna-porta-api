import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsBoolean, IsOptional, IsString, IsNumber} from "class-validator";

export class UpdateCompanyDto {
    @ApiProperty({
        description: 'Company name',
        example: 'Tech Corp',
    })
    @IsString()
    name: string;
    @ApiPropertyOptional({
        description: 'Is active',
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Is verified',
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    isVerified?: boolean;

    @ApiPropertyOptional({
        description: 'Airwallex account ID',
        example: 'acct_lnVrIs5wOaOi-6k004SpPA',
    })
    @IsString()
    @IsOptional()
    airwallex_account_id?: string;

    @ApiPropertyOptional({
        description: 'Plan ID for this company',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    planId?: number;
}