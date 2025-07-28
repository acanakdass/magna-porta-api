import {Injectable} from "@nestjs/common";
import {AirwallexClient} from "../client";
import {AwAccountCreationRequest} from "../dtos/aw-account-dtos/aw-account-creation-request";
import {AwAccountCreationResponse} from "../dtos/aw-account-dtos/aw-account-creation-response";
import axios from "axios";
import {airwallexConfig} from "../config";
import {AwAuthService} from "./aw-auth.service";

/**
 * Service for creating and managing Airwallex accounts
 */
@Injectable()
export class AwAccountService {

    private client: AirwallexClient;

    constructor(private awAuthService: AwAuthService) {
        this.client = new AirwallexClient();
    }

    async createAccount(accountData: AwAccountCreationRequest): Promise<AwAccountCreationResponse> {
        try {
            // Get a fresh authentication token to ensure it's valid
            const token = await this.awAuthService.getAuthToken({onBehalfOf: undefined,forceNew: true});

            console.log('Creating Airwallex account with data:', accountData);

            // Add service_agreement_type if not provided
            if (!accountData.customer_agreements?.terms_and_conditions?.service_agreement_type) {
                accountData.customer_agreements.terms_and_conditions.service_agreement_type = 'FULL';
            }

            // Create a direct API call with the token
            const response = await  axios.request({
                url: `${airwallexConfig.baseUrl}/api/v1/accounts/create`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                data: accountData,
            });

            console.log('Account created successfully:', {
                id: response.data.id,
                status: response.data.status
            });

            return response.data;
        } catch (error: any) {
            console.error('Error creating Airwallex account:', error.response?.data || error.message);
            throw error;
        }
    }

    async getAccount(accountId: string): Promise<any> {
        try {
            return await this.client.get<any>(`/api/v1/accounts/${accountId}`);
        } catch (error: any) {
            console.error('Error retrieving Airwallex account:', error.response?.data || error.message);
            throw error;
        }
    }

}



