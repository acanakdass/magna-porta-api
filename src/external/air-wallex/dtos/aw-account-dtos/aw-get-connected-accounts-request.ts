import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsPositive, Min, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AwGetConnectedAccountsRequest {
    @ApiPropertyOptional({
        description: 'Status of the account (e.g., active, inactive)',
        example: 'active',
    })
    @IsOptional()
    @IsString()
    account_status?: string;

    @ApiPropertyOptional({
        description: 'Filter by email address',
        example: 'user@example.com',
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'Filter accounts created from this date',
        example: '2023-01-01T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    from_created_at?: string;

    @ApiPropertyOptional({
        description: 'Filter accounts created until this date',
        example: '2023-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    to_created_at?: string;

    @ApiPropertyOptional({
        description: 'Filter by a unique identifier for the account',
        example: 'unique-identifier-123',
    })
    @IsOptional()
    @IsString()
    identifier?: string;

    @ApiPropertyOptional({
        description: 'Filter by metadata related to the account',
        example: 'custom-metadata-value',
    })
    @IsOptional()
    @IsString()
    metadata?: string;

    @ApiPropertyOptional({
        description: 'Page number for pagination. Starts from 1.',
        example: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10)) // Ensure input is transformed into a number
    @IsNumber()
    @Min(1)
    page_num?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page. Defaults to 100.',
        example: 100,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10)) // Ensure input is transformed into a number
    @IsNumber()
    @IsPositive()
    page_size?: number = 100;
}