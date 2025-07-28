import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsBoolean, IsOptional, IsString} from "class-validator";

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
}