import {ApiPropertyOptional} from "@nestjs/swagger";
import {Type} from "class-transformer";
import {IsIn, IsInt, IsOptional, IsString, Min} from "class-validator";

export class PaginationDto {
    @ApiPropertyOptional({
        description: 'Page number (starts from 1)',
        default: 1,
        minimum: 1
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;


    @ApiPropertyOptional({
        description: 'Number of items per page',
        default: 10,
        minimum: 1
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Sort field',
        default: 'createdAt'
    })
    @IsString()
    @IsOptional()
    orderBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort direction',
        enum: ['ASC', 'DESC'],
        default: 'DESC'
    })
    @IsString()
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    order?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        description: 'Search term to filter results',
        default: ''
    })
    @IsString()
    @IsOptional()
    search?: string;

    select?: string[];
    relations?: string[];
    where?: Record<string, any>;

}

export class PaginatedResponseDto<T> {
    @ApiPropertyOptional()
    data: T[];

    @ApiPropertyOptional()
    meta: {
        totalItems: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}