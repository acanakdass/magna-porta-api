import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { airwallexConfig } from '../config';
import { AwAuthService } from "./aw-auth.service";
import { BaseApiResponse } from "../../../common/dto/api-response-dto";
import { v4 as uuidv4 } from 'uuid';
import { AwAccountCreationRequest } from "../dtos/aw-account-dtos/aw-account-creation-request";
import { AwAccountCreationResponse } from "../dtos/aw-account-dtos/aw-account-creation-response";

@Injectable()
export class AwAccountService {

    constructor(private readonly authService: AwAuthService) {}

    /**
     * Create a new account
     * @param data The account creation request data
     * @param accountId Optional account ID to use for the request
     * @returns Account creation response
     */
    async createAccount(
        data: AwAccountCreationRequest, 
        accountId?: string
    ): Promise<BaseApiResponse<AwAccountCreationResponse>> {
        try {
            console.log('=== Starting Account Create API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            console.log(token)
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Ensure request has a unique ID
            const requestData = {
                ...data
            };
            
            console.log(`Making Account Create API request to: ${airwallexConfig.baseUrl}/api/v1/accounts/create`);
            console.log('Request data:', JSON.stringify(requestData, null, 2));

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/accounts/create`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                data: requestData,
            };

            // Add service_agreement_type if not provided
            if (!requestData.customer_agreements?.terms_and_conditions?.service_agreement_type) {
                requestData.customer_agreements.terms_and_conditions.service_agreement_type = 'FULL';
            }

            // Make the API call
            const response = await axios(options);
            console.log('Account created successfully:', {
                id: response.data.id,
                status: response.data.status
            });

            return {
                success: true,
                message: 'Account created successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Error creating Airwallex account:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                throw new UnauthorizedException('Authentication failed. Please check your credentials. Error: ' + error.response?.data);
            }
            throw new InternalServerErrorException('Failed to create Airwallex account. Error: ' + JSON.stringify(error.response?.data));
        }
    }

    async getAccount(accountId: string): Promise<any> {
        try {
            const token = await this.authService.getAuthToken({ forceNew: false });
            
            const response = await axios.get(`${airwallexConfig.baseUrl}/api/v1/accounts/${accountId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            return response.data;
        } catch (error: any) {
            console.error('Error retrieving Airwallex account:', error.response?.data || error.message);
            throw error;
        }
    }
}



