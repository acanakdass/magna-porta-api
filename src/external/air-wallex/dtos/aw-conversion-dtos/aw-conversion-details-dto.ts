export class AwConversionDetails {
    application_fee_options?: Array<{
        amount: string;
        currency: string;
        metadata?: Record<string, any>;
        percentage: string;
        source_type: string;
        type: string;
    }>;
    application_fees?: Array<{
        amount: string;
        currency: string;
        source_type: string;
    }>;
    awx_rate: number;
    buy_amount: number;
    buy_currency: string;
    client_rate: number;
    conversion_date: string;
    conversion_id: string;
    created_at: string;
    currency_pair: string;
    dealt_currency: string;
    funding?: {
        debit_type: string;
        failure_reason: string;
        funding_source_id: string;
        status: string;
    };
    funding_source?: {
        debit_type: string;
        id: string;
    };
    mid_rate: number;
    quote_id: string;
    rate_details?: Array<{
        buy_amount: number;
        level: string;
        rate: number;
        sell_amount: number;
    }>;
    request_id: string;
    sell_amount: number;
    sell_currency: string;
    settlement_cutoff_at: string;
    short_reference_id: string;
    status: string;
    updated_at: string;
} 