import {Injectable} from '@nestjs/common';
import axios, {AxiosInstance} from 'axios';
import {airwallexConfig} from '../config';
import {AwAuthService} from "./aw-auth.service";
import {AwGetConnectedAccountsRequest} from '../dtos/aw-account-dtos/aw-get-connected-accounts-request';
import {AwConnectedAccountsResponse} from "../dtos/aw-account-dtos/aw-connected-accounts-response";
import {BaseApiResponse} from "../../../common/dto/api-response-dto";


@Injectable()
export class AwConnectedAccountsService {
    private client: AxiosInstance;
    private maxRetries: number = 3;

    constructor(private readonly authService: AwAuthService) {
        this.client = axios.create({
            timeout: 10000, // 10 seconds timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get all connected accounts
     * @param request - Data transfer object for retrieving connected accounts
     * @returns Promise resolving to ConnectedAccountsResponse
     */
    async getConnectedAccounts(request: AwGetConnectedAccountsRequest): Promise<BaseApiResponse<AwConnectedAccountsResponse>> {
        let retries = 0;
        let lastError: any = null;

        while (retries < this.maxRetries) {
            try {
                const token = await this.authService.getAuthToken({forceNew: retries > 0}); // Force new token after first retry

                if (!token) {
                    throw new Error('Authentication token is null or undefined');
                }
                console.log("token: " + token)
                console.log(`Making Airwallex Connected Accounts API request (Attempt: ${retries + 1})`);

                // Create query parameters using DTO fields
                const queryParams = new URLSearchParams();
                if (request.account_status) queryParams.append('account_status', request.account_status);
                if (request.email) queryParams.append('email', request.email);
                if (request.from_created_at) queryParams.append('from_created_at', request.from_created_at);
                if (request.to_created_at) queryParams.append('to_created_at', request.to_created_at);
                if (request.identifier) queryParams.append('identifier', request.identifier);
                if (request.metadata) queryParams.append('metadata', request.metadata);
                if (request.page_num !== undefined) queryParams.append('page_num', request.page_num.toString());
                if (request.page_size !== undefined) queryParams.append('page_size', request.page_size.toString());

                const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

                const response = await this.client.request({
                    // url: `${airwallexConfig.baseUrl}/api/v1/accounts${queryString}`,
                    url: `${airwallexConfig.baseUrl}/api/v1/accounts`,
                    method: 'get',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    validateStatus: (status) => status === 200, // Only consider 200 status code as success
                });
                // If we received a valid response and data.items exists
                if (response.data && Array.isArray(response.data.items)) {
                    console.log('Connected Accounts successfully retrieved:', response.data.items.length);
                    // return response.data;
                    return {
                        data: response.data,
                        message: "success",
                        success: true
                    } as BaseApiResponse<AwConnectedAccountsResponse>;
                } else {
                    console.error('API did not provide a valid response:', response.data);
                    throw new Error('API did not provide a valid response.');
                }
            } catch (error: any) {
                lastError = error;
                console.log("error: " + error)
                // Log error details
                console.error('Error retrieving connected accounts:', {
                    message: error.message + " " + error.response?.data?.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    attempt: retries + 1,
                });


                // For authentication errors or rate limiting, wait before retrying
                if (error.response?.status === 401 || error.response?.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Wait progressively: 1s, 2s, 3s
                    this.authService.clearTokenCache();
                }

                retries++;
            }
        }


        // If all retries failed, throw the last error
        console.error('Maximum number of retries reached. Could not retrieve connected accounts.');
        return {
            data: null,
            message: lastError.message,
            success: false
        } as BaseApiResponse<AwConnectedAccountsResponse>;
        // var result = new BaseApiResponse<AwConnectedAccountsResponse>();
        // result.data == null;
        // result.message = lastError.message;
        // result.success = false;
        // return result;
        // throw lastError || new Error('Could not retrieve connected accounts. Maximum number of retries reached.');
    }


    /**
     * Get a single connected account by ID
     * @param accountId - The ID of the connected account to retrieve
     * @returns Promise resolving to the full API response
     */
    async getConnectedAccountByID(accountId: string): Promise<any> {
        let retries = 0;
        let lastError: any = null;

        while (retries < this.maxRetries) {
            try {
                const token = await this.authService.getAuthToken({forceNew: retries > 0});

                if (!token) {
                    throw new Error('Authentication token is null or undefined');
                }

                console.log(`Making Airwallex Connected Account Get API request for ID: ${accountId} (Attempt: ${retries + 1})`);

                const response = await this.client.request({
                    url: `${airwallexConfig.baseUrl}/api/v1/accounts/${accountId}`,
                    method: 'get',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    validateStatus: (status) => status === 200, // Only consider 200 status code as success
                });

                console.log('Connected Account successfully retrieved');
                return response.data;
            } catch (error: any) {
                lastError = error;

                console.error('Error retrieving connected account:', {
                    accountId,
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    attempt: retries + 1,
                });

                // For authentication errors or rate limiting, wait before retrying
                if (error.response?.status === 401 || error.response?.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Wait progressively: 1s, 2s, 3s
                    this.authService.clearTokenCache();
                }

                retries++;
            }
        }

        console.error('Maximum number of retries reached. Could not retrieve connected account.');
        throw lastError || new Error('Could not retrieve connected account. Maximum number of retries reached.');
    }
}