export class AwGlobalAccount {
    id: string;
    currency: string;
    account_name: string;
    account_number: string;
    identifier: string;
    status: string;
    created_at: string;
    bank_details?: {
        country_code: string;
        bank_name: string;
        bank_code: string;
    };
} 