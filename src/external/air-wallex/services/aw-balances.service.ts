import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { airwallexConfig } from '../config';
import {AwAuthService} from "./aw-auth.service";
import {BaseApiResponse} from "../../../common/dto/api-response-dto";
import {AwBalancesResponse} from "../dtos/aw-balance-dtos/aw-balances-response";
import {AwBalance} from "../dtos/aw-balance-dtos/aw-balance-dto";



@Injectable()
export class BalanceService {

    constructor(private readonly authService: AwAuthService) {}

    /**
     * Get current balances for the account
     * @param accountId The account ID to query balances for
     * @param scaToken5m Optional SCA token with 5-min validity
     * @returns Normalized balances response
     */
    async getBalances(accountId: string | undefined, scaToken5m: string | undefined): Promise<BaseApiResponse<AwBalancesResponse>> {
        try {
            console.log('=== Starting Balance Service API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false});
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Construct the query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('page_size', '100');
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

            console.log(`Making Airwallex Balances API request to: ${airwallexConfig.baseUrl}/api/v1/balances/current${queryString}`);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/balances/current${queryString}`,
                method: 'get',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-on-behalf-of': accountId,
                    'x-sca-token': scaToken5m,
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status === 200,
            };

            // Make the API request
            const response = await axios.request(options);

            console.log('Balance API response received with status:', response.status);

            // Normalize and validate the response
            let normalizedResponse = this.normalizeResponse(response.data);
            return {
                success:true,
                data:normalizedResponse,
                message:"success"
            } as BaseApiResponse<AwBalancesResponse>
        } catch (error: any) {
            // Log error details
            console.error('Error retrieving balances:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            return {
                success:false,
                data:null,
                message:'Failed to retrieve balances: '+ error.message
            } as BaseApiResponse<AwBalancesResponse>

        }
    }

    /**
     * Normalize the API response to a consistent format
     * @param data The raw API response data
     * @returns Normalized balances response
     */
    private normalizeResponse(data: any): AwBalancesResponse {
        let normalizedResponse: AwBalancesResponse;

        if (Array.isArray(data)) {
            console.log(`Response is an array with ${data.length} items`);
            normalizedResponse = {
                items: data,
                page_num: 1,
                page_size: data.length,
                total_count: data.length,
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
                    items: arrayValue as AwBalance[],
                    page_num: 1,
                    page_size: (arrayValue as any[]).length,
                    total_count: (arrayValue as any[]).length,
                };
            } else {
                console.log('No array property found, treating response as a single balance item');
                normalizedResponse = {
                    items: [data as AwBalance],
                    page_num: 1,
                    page_size: 1,
                    total_count: 1,
                };
            }
        } else {
            console.error('Unexpected response format:', data);
            throw new InternalServerErrorException('API response has an unexpected format');
        }

        console.log('Balances successfully normalized:', normalizedResponse.items.length);
        return normalizedResponse;
    }
}