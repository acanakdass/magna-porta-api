import {ApiPropertyOptional} from "@nestjs/swagger";
import {IsBoolean, IsOptional, IsString} from "class-validator";
import {Transform} from "class-transformer";
import {PaginationDto} from "./pagination-dto";

export class UserQueryDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Search by email',
        example: 'user@example.com'
    })
    @IsString()
    @IsOptional()
    @Transform(({value}) => value.toLowerCase())
    email?: string;

    @ApiPropertyOptional({
        description: 'Search by role',
        example: 'admin'
    })
    @IsString()
    @IsOptional()
    role?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: true
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({value}) => value === 'true')
    isActive?: boolean;
}