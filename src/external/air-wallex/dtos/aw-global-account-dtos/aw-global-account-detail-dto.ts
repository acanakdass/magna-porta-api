export class AwGlobalAccountDetail {
    id: string;
    currency: string;
    account_name: string;
    account_number: string;
    identifier: string;
    status: string;
    created_at: string;
    updated_at?: string;
    bank_details?: {
        country_code: string;
        bank_name: string;
        bank_code: string;
        branch_name?: string;
        branch_code?: string;
        account_type?: string;
        routing_number?: string;
        swift_code?: string;
        iban?: string;
    };
    features?: Array<{
        currency: string;
        transfer_method: 'LOCAL' | 'SWIFT';
        status: string;
    }>;
    metadata?: Record<string, any>;
} 