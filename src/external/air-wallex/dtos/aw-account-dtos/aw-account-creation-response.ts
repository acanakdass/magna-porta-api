

export class AwAccountCreationResponse {
    id: string;
    account_details: any;
    created_at: string;
    customer_id: string;
    identifier: string;
    nickname: string;
    primary_contact: {
        email: string;
        mobile?: string;
    };
    status: string;
}