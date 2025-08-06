import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { airwallexConfig } from '../config';
import { AwAuthService } from "./aw-auth.service";
import { BaseApiResponse } from "../../../common/dto/api-response-dto";
import { v4 as uuidv4 } from 'uuid';
import { 
    AwConversionsResponse, 
    AwConversionDetails, 
    AwConversionQueryDto,
    AwConversionCreateRequest,
    AwConversionCreateResponse
} from "../dtos/aw-conversion-dtos";

@Injectable()
export class AwConversionService {

    constructor(private readonly authService: AwAuthService) {}

    /**
     * Get all conversions for the account
     * @param params Optional query parameters
     * @param accountId Optional account ID to use for the request
     * @returns Normalized conversions response
     */
    async getConversions(
        params: AwConversionQueryDto = {}, 
        accountId?: string
    ): Promise<BaseApiResponse<AwConversionsResponse>> {
        try {
            console.log('=== Starting Conversion Service API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Create query parameters
            const queryParams = new URLSearchParams();
            if (params.buy_currency) queryParams.append('buy_currency', params.buy_currency);
            if (params.sell_currency) queryParams.append('sell_currency', params.sell_currency);
            if (params.from_created_at) queryParams.append('from_created_at', params.from_created_at);
            if (params.to_created_at) queryParams.append('to_created_at', params.to_created_at);
            if (params.status) queryParams.append('status', params.status);
            if (params.page_num !== undefined) queryParams.append('page_num', params.page_num.toString());
            if (params.page_size !== undefined) {
                queryParams.append('page_size', params.page_size.toString());
            } else {
                queryParams.append('page_size', '100'); // Default page size
            }

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

            console.log(`Making Airwallex Conversions API request to: ${airwallexConfig.baseUrl}/api/v1/fx/conversions${queryString}`);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/fx/conversions${queryString}`,
                method: 'get',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-on-behalf-of': accountId,
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status === 200,
            };
            console.log(`${airwallexConfig.baseUrl}/api/v1/fx/conversions${queryString}`)

            // Make the API request
            const response = await axios.request(options);

            console.log('Conversions API response received with status:', response.status);

            // Normalize and validate the response
            let normalizedResponse = this.normalizeConversionsResponse(response.data);
            return {
                success: true,
                data: normalizedResponse,
                message: "Conversions retrieved successfully"
            } as BaseApiResponse<AwConversionsResponse>;

        } catch (error: any) {
            // Log error details
            console.error('Error retrieving conversions:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            return {
                success: false,
                data: null,
                message: 'Failed to retrieve conversions: ' + error.message
            } as BaseApiResponse<AwConversionsResponse>;
        }
    }

    /**
     * Get conversion details by ID
     * @param accountId The account ID to use for the request
     * @param conversionId The ID of the conversion to retrieve
     * @returns Conversion details response
     */
    async getConversionById(
        accountId: string, 
        conversionId: string
    ): Promise<BaseApiResponse<AwConversionDetails>> {
        try {
            console.log(`=== Starting Conversion Details API Call for ID: ${conversionId} ===`);

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            console.log(`Making Airwallex API request for conversion ID ${conversionId}`);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/fx/conversions/${conversionId}`,
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

            console.log('Conversion details API response received with status:', response.status);

            // Validate the response
            if (response.data && response.data.conversion_id) {
                console.log('Conversion details successfully retrieved for ID:', conversionId);
                return {
                    success: true,
                    data: response.data as AwConversionDetails,
                    message: "Conversion details retrieved successfully"
                } as BaseApiResponse<AwConversionDetails>;
            } else {
                throw new InternalServerErrorException('API did not provide a valid response. Conversion data not found.');
            }

        } catch (error: any) {
            // Log error details
            console.error(`Error retrieving conversion details for ID ${conversionId}:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            return {
                success: false,
                data: null,
                message: `Failed to retrieve conversion details: ${error.message}`
            } as BaseApiResponse<AwConversionDetails>;
        }
    }

    /**
     * Normalize the conversions API response to a consistent format
     * @param data The raw API response data
     * @returns Normalized conversions response
     */
    private normalizeConversionsResponse(data: any): AwConversionsResponse {
        let normalizedResponse: AwConversionsResponse;

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
                    items: arrayValue as any[],
                    page_num: 1,
                    page_size: (arrayValue as any[]).length,
                    total_count: (arrayValue as any[]).length,
                };
            } else {
                console.log('No array property found, treating response as a single conversion item');
                normalizedResponse = {
                    items: [data as any],
                    page_num: 1,
                    page_size: 1,
                    total_count: 1,
                };
            }
        } else {
            console.error('Unexpected response format:', data);
            throw new InternalServerErrorException('API response has an unexpected format');
        }

        console.log('Conversions successfully normalized:', normalizedResponse.items.length);
        return normalizedResponse;
    }

    /**
     * Create a new conversion
     * @param params Conversion creation parameters
     * @param accountId Optional account ID to use for the request
     * @returns Conversion creation response
     */
    async createConversion(
        params: Omit<AwConversionCreateRequest, 'request_id'>, 
        accountId?: string
    ): Promise<BaseApiResponse<AwConversionCreateResponse>> {
        try {
            console.log('=== Starting Conversion Create API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Generate a unique request ID
            const requestId = uuidv4();
            
            // Prepare the request data
            const requestData: AwConversionCreateRequest = {
                ...params,
                request_id: requestId
            };
            
            console.log("Calling Airwallex Conversion Create API with data:", requestData);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/fx/conversions/create`,
                method: 'post',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-on-behalf-of': accountId
                },
                data: requestData,
                validateStatus: (status) => status === 201 || status === 200
            };
console.log("requestDataaaaa")
console.log(requestData)
            // Make the API request
            const response = await axios.request(options);

            console.log("Conversion Create API response:", response.data);

            return {
                success: true,
                data: {
                    ...response.data,
                    request_id: requestId
                } as AwConversionCreateResponse,
                message: "Conversion created successfully"
            } as BaseApiResponse<AwConversionCreateResponse>;

        } catch (error: any) {
            // Log error details
            console.error("Conversion Create API error:", error);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
            
            return {
                success: false,
                data: null,
                message: `Failed to create conversion: ${error.message}`
            } as BaseApiResponse<AwConversionCreateResponse>;
        }
    }
} 