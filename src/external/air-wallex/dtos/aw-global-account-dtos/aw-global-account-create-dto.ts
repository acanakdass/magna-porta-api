export class AwGlobalAccountCreateFeature {
    currency: string;
    transfer_method: 'LOCAL' | 'SWIFT';
}

export class AwGlobalAccountCreateRequest {
    country_code: string;
    nick_name: string;
    request_id?: string;
    required_features: AwGlobalAccountCreateFeature[];
}

export class AwGlobalAccountCreateResponse {
    id: string;
    account_name: string;
    account_number: string;
    currency: string;
    country_code: string;
    status: string;
    created_at: string;
    bank_details?: {
        bank_name: string;
        bank_code: string;
        branch_name?: string;
        branch_code?: string;
    };
} 