export class AwConversionCreateRequest {
    buy_amount?: string;
    buy_currency: string;
    conversion_date: string;
    request_id: string;
    sell_amount?: string;
    sell_currency: string;
}

export class AwConversionCreateResponse {
    conversion_id: string;
    request_id: string;
    status: string;
    buy_currency: string;
    sell_currency: string;
    buy_amount?: string;
    sell_amount?: string;
    conversion_date: string;
    created_at: string;
    updated_at: string;
    awx_rate?: number;
    client_rate?: number;
    mid_rate?: number;
    currency_pair?: string;
    short_reference_id?: string;
    settlement_cutoff_at?: string;
} 