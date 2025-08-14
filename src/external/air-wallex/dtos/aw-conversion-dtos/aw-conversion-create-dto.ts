import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AwConversionCreateRequest {
    @ApiProperty({
        description: 'Account ID for the conversion',
        example: 'acc_123456789',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    account_id: string;

    @ApiProperty({
        description: 'Buy amount for the conversion',
        example: '1000.00',
        required: false
    })
    @IsOptional()
    @IsString()
    buy_amount?: string;

    @ApiProperty({
        description: 'Buy currency code',
        example: 'USD',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    buy_currency: string;

    @ApiProperty({
        description: 'Conversion date in ISO format',
        example: '2024-01-15',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    conversion_date: string;

    @ApiProperty({
        description: 'Unique request ID (auto-generated)',
        example: 'req_123456789',
        required: false
    })
    @IsOptional()
    @IsString()
    request_id: string;

    @ApiProperty({
        description: 'Sell amount for the conversion',
        example: '850.00',
        required: false
    })
    @IsOptional()
    @IsString()
    sell_amount?: string;

    @ApiProperty({
        description: 'Sell currency code',
        example: 'EUR',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    sell_currency: string;
}

export class AwConversionCreateResponse {
    @ApiProperty({
        description: 'Unique conversion ID',
        example: 'conv_123456789'
    })
    conversion_id: string;

    @ApiProperty({
        description: 'Request ID used for creation',
        example: 'req_123456789'
    })
    request_id: string;

    @ApiProperty({
        description: 'Conversion status',
        example: 'pending'
    })
    status: string;

    @ApiProperty({
        description: 'Buy currency code',
        example: 'USD'
    })
    buy_currency: string;

    @ApiProperty({
        description: 'Sell currency code',
        example: 'EUR'
    })
    sell_currency: string;

    @ApiProperty({
        description: 'Buy amount',
        example: '1000.00',
        required: false
    })
    buy_amount?: string;

    @ApiProperty({
        description: 'Sell amount',
        example: '850.00',
        required: false
    })
    sell_amount?: string;

    @ApiProperty({
        description: 'Conversion date',
        example: '2024-01-15'
    })
    conversion_date: string;

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2024-01-15T10:30:00Z'
    })
    created_at: string;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2024-01-15T10:30:00Z'
    })
    updated_at: string;

    @ApiProperty({
        description: 'Airwallex exchange rate',
        example: 1.176,
        required: false
    })
    awx_rate?: number;

    @ApiProperty({
        description: 'Client exchange rate',
        example: 1.175,
        required: false
    })
    client_rate?: number;

    @ApiProperty({
        description: 'Mid-market rate',
        example: 1.1755,
        required: false
    })
    mid_rate?: number;

    @ApiProperty({
        description: 'Currency pair',
        example: 'USD/EUR',
        required: false
    })
    currency_pair?: string;

    @ApiProperty({
        description: 'Short reference ID',
        example: 'REF123',
        required: false
    })
    short_reference_id?: string;

    @ApiProperty({
        description: 'Settlement cutoff time',
        example: '2024-01-15T16:00:00Z',
        required: false
    })
    settlement_cutoff_at?: string;
} 