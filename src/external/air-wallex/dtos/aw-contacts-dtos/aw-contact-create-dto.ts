export class AwContactCreateRequest {
    beneficiary: {
        additional_info?: {
            external_identifier?: string;
            personal_email?: string;
        };
        address?: {
            city: string;
            country_code: string;
            postcode: string;
            state: string;
            street_address: string;
        };
        bank_details: {
            account_currency: string;
            account_name: string;
            account_number?: string;
            account_routing_type1?: string;
            account_routing_value1?: string;
            bank_country_code: string;
            local_clearing_system?: string;
            iban?: string;
        };
        company_name?: string;
        entity_type: string;
        type: string;
    };
    nickname: string;
    transfer_methods: string[];
}

export class AwContactCreateResponse {
    id: string;
    beneficiary: any;
    created_at: string;
    nickname: string;
    status: string;
} 