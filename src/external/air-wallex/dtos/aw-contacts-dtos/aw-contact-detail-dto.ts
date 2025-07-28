export class AwContactDetail {
    beneficiary: {
        additional_info?: {
            business_area?: string;
            business_phone_number?: string;
            business_registration_number?: string;
            external_identifier?: string;
            legal_rep_bank_account_number?: string;
            legal_rep_first_name_in_chinese?: string;
            legal_rep_id_number?: string;
            legal_rep_last_name_in_chinese?: string;
            legal_rep_mobile_number?: string;
            personal_email?: string;
            personal_first_name_in_chinese?: string;
            personal_id_number?: string;
            personal_id_type?: string;
            personal_last_name_in_chinese?: string;
            personal_mobile_number?: string;
            [key: string]: any;
        };
        address?: {
            city?: string;
            country_code?: string;
            postcode?: string;
            state?: string;
            street_address?: string;
            [key: string]: any;
        };
        bank_details?: {
            account_currency?: string;
            account_name?: string;
            account_name_alias?: string;
            account_number?: string;
            account_routing_type1?: string;
            account_routing_type2?: string;
            account_routing_value1?: string;
            account_routing_value2?: string;
            bank_account_category?: string;
            bank_branch?: string;
            bank_country_code?: string;
            bank_name?: string;
            bank_state?: string;
            bank_street_address?: string;
            binding_mobile_number?: string;
            fingerprint?: string;
            iban?: string;
            intermediary_bank_name?: string;
            intermediary_bank_swift_code?: string;
            local_clearing_system?: string;
            swift_code?: string;
            [key: string]: any;
        };
        company_name?: string;
        date_of_birth?: string;
        digital_wallet?: {
            account_name?: string;
            id_type?: string;
            id_value?: string;
            provider?: string;
            [key: string]: any;
        };
        entity_type?: string;
        first_name?: string;
        last_name?: string;
        type?: string;
        [key: string]: any;
    };
    id: string;
    nickname?: string;
    payer_entity_type?: string;
    transfer_methods?: string[];
    [key: string]: any;
} 