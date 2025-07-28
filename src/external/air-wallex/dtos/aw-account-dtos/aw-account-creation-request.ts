export class AwAccountCreationRequest {
    account_details: {
        business_details: {
            business_name: string;
            // Other optional fields can be added as needed
        };
    };
    customer_agreements: {
        agreed_to_data_usage: boolean;
        agreed_to_terms_and_conditions: boolean;
        terms_and_conditions: {
            agreed_at: string;
            device_data?: {
                ip_address?: string;
                user_agent?: string;
            };
            service_agreement_type: string;
        };
    };
    primary_contact: {
        email: string;
    };
}