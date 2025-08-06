import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { airwallexConfig } from '../config';
import { AwAuthService } from "./aw-auth.service";
import { BaseApiResponse } from "../../../common/dto/api-response-dto";
import { v4 as uuidv4 } from 'uuid';
import { 
    AwGlobalAccountsResponse,
    AwGlobalAccountCreateRequest,
    AwGlobalAccountCreateResponse,
    AwGlobalAccountDetail
} from "../dtos/aw-global-account-dtos";

@Injectable()
export class AwGlobalAccountService {

    constructor(private readonly authService: AwAuthService) {}

    /**
     * Get all global accounts for the account
     * @param accountId Optional account ID to use for the request
     * @returns Normalized global accounts response
     */
    async getGlobalAccounts(accountId?: string): Promise<BaseApiResponse<AwGlobalAccountsResponse>> {
        try {
            console.log('=== Starting Global Account Service API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            console.log(`Making Airwallex Global Accounts API request to: ${airwallexConfig.baseUrl}/api/v1/global_accounts`);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/global_accounts`,
                method: 'get',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-on-behalf-of': accountId
                },
                validateStatus: (status) => status === 200,
            };

            // Make the API request
            const response = await axios.request(options);

            console.log('Global Accounts API response received with status:', response.status);

            // Normalize and validate the response
            let normalizedResponse = this.normalizeGlobalAccountsResponse(response.data);
            return {
                success: true,
                data: normalizedResponse,
                message: "Global accounts retrieved successfully"
            } as BaseApiResponse<AwGlobalAccountsResponse>;

        } catch (error: any) {
            // Log error details
            console.error('Error retrieving global accounts:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            return {
                success: false,
                data: null,
                message: 'Failed to retrieve global accounts: ' + error.message
            } as BaseApiResponse<AwGlobalAccountsResponse>;
        }
    }

    /**
     * Normalize the global accounts API response to a consistent format
     * @param data The raw API response data
     * @returns Normalized global accounts response
     */
    private normalizeGlobalAccountsResponse(data: any): AwGlobalAccountsResponse {
        let normalizedResponse: AwGlobalAccountsResponse;

        if (Array.isArray(data)) {
            console.log(`Response is an array with ${data.length} items`);
            normalizedResponse = {
                items: data,
                page_after: undefined,
                page_before: undefined,
            };
        } else if (data && Array.isArray(data.items)) {
            console.log('Response has expected items array structure');
            normalizedResponse = data;
        } else if (data && typeof data === 'object') {
            console.log('Response has unexpected structure, attempting to normalize');
            console.log('Actual response structure:', JSON.stringify(data, null, 2));

            const possibleArrayProps = Object.entries(data).find(([_, value]) => Array.isArray(value));

            if (possibleArrayProps) {
                const [, arrayValue] = possibleArrayProps;
                console.log(`Found array property: ${possibleArrayProps[0]}`);
                normalizedResponse = {
                    items: arrayValue as any[],
                    page_after: undefined,
                    page_before: undefined,
                };
            } else {
                console.log('No array property found, treating response as a single global account item');
                normalizedResponse = {
                    items: [data as any],
                    page_after: undefined,
                    page_before: undefined,
                };
            }
        } else {
            console.error('Unexpected response format:', data);
            throw new InternalServerErrorException('API response has an unexpected format');
        }

        console.log('Global accounts successfully normalized:', normalizedResponse.items.length);
        return normalizedResponse;
    }

    /**
     * Create a new global account
     * @param data The global account creation request data
     * @param accountId Optional account ID to use for the request
     * @returns Global account creation response
     */
    async createGlobalAccount(
        data: AwGlobalAccountCreateRequest, 
        accountId?: string
    ): Promise<BaseApiResponse<AwGlobalAccountCreateResponse>> {
        try {
            console.log('=== Starting Global Account Create API Call ===');
console.log(data)
            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Ensure request has a unique ID
            const requestData = {
                ...data,
                request_id: data.request_id || uuidv4()
            };
            console.log("requestData")
            console.log(requestData)
            const isProd = process.env.NODE_ENV === 'production';
            const baseUrl = isProd 
              ? (process.env.AW_BASE_URL_PROD || 'https://api.airwallex.com')
              : (process.env.AW_BASE_URL_DEMO || 'https://api.airwallex.com');
            console.log(`Making Global Account Create API request to: ${airwallexConfig.baseUrl}/api/v1/global_accounts/create`);
            console.log('Request data:', JSON.stringify(requestData, null, 2));

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/global_accounts/create`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-on-behalf-of': accountId
                },
                data: requestData,
                validateStatus: (status) => status === 200 || status === 201
            };

            // Make the API request
            const response = await axios.request(options);

            console.log('Global Account Create API response received with status:', response.status);

            // Validate the response
            if (response.data && response.data.id) {
                console.log('Global account successfully created:', response.data.id);
                return {
                    success: true,
                    data: response.data as AwGlobalAccountCreateResponse,
                    message: "Global account created successfully"
                } as BaseApiResponse<AwGlobalAccountCreateResponse>;
            } else {
                throw new InternalServerErrorException('API did not provide a valid response. Account ID not found.');
            }

        } catch (error: any) {
            // Log error details
            console.error('Error creating global account:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            
            return {
                success: false,
                data: null,
                message: `Failed to create global account: ${error.message}`
            } as BaseApiResponse<AwGlobalAccountCreateResponse>;
        }
    }

    /**
     * Get a specific global account by ID
     * @param globalAccountId The ID of the global account to retrieve
     * @param accountId The ID of the account to retrieve
     * @returns Global account details response
     */
    async getGlobalAccountById(
        globalAccountId: string, 
        accountId?: string
    ): Promise<BaseApiResponse<AwGlobalAccountDetail>> {
        try {
            if (!globalAccountId) {
                throw new Error('Global account ID is required');
            }

            console.log(`=== Starting Global Account Detail API Call for ID: ${globalAccountId} ===`);

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            const isProd = process.env.NODE_ENV === 'production';
            const baseUrl = isProd 
              ? (process.env.AW_BASE_URL_PROD || 'https://api.airwallex.com')
              : (process.env.AW_BASE_URL_DEMO || 'https://api.airwallex.com');

            console.log(`Making Airwallex API request for account ID ${globalAccountId}`);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/global_accounts/${globalAccountId}`,
                method: 'get',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-on-behalf-of': accountId
                },
                validateStatus: (status) => status === 200,
            };

            // Make the API request
            const response = await axios.request(options);

            console.log('Global Account Detail API response received with status:', response.status);

            // Validate the response
            if (response.data && response.data.id) {
                console.log('Global account details successfully retrieved for ID:', globalAccountId);
                return {
                    success: true,
                    data: response.data as AwGlobalAccountDetail,
                    message: "Global account details retrieved successfully"
                } as BaseApiResponse<AwGlobalAccountDetail>;
            } else {
                throw new InternalServerErrorException('API did not provide a valid response. Account data not found.');
            }

        } catch (error: any) {
            // Log error details
            console.error(`Error retrieving global account details for ID ${globalAccountId}:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            
            return {
                success: false,
                data: null,
                message: `Failed to retrieve global account details: ${error.message}`
            } as BaseApiResponse<AwGlobalAccountDetail>;
        }
    }
} 