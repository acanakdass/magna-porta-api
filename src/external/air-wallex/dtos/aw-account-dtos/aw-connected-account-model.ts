export class AwConnectedAccountModel {
    id: string;
    created_at: string;
    updated_at: string;
    account_name: string;
    account_status: string;
    email: string;
    identifier: string;
    metadata?: any;
    company?: {
        name: string;
        registration_number: string;
        entity_type: string;
        country_code: string;
    };
    person?: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
        address: {
            country_code: string;
            state: string;
            city: string;
            street_address: string;
            postcode: string;
        };
    };
}

