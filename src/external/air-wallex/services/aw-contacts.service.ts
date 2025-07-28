import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { airwallexConfig } from '../config';
import { AwAuthService } from './aw-auth.service';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { 
    AwContactsResponse,
    AwContactDetail,
    AwContactsQueryDto,
    AwContactCreateRequest,
    AwContactCreateResponse
} from '../dtos/aw-contacts-dtos';

@Injectable()
export class AwContactsService {
    private readonly maxRetries: number = 3;

    constructor(private readonly authService: AwAuthService) {}

    /**
     * Get contacts (beneficiaries)
     * @param params Query parameters for the request
     * @param accountId Optional account ID to use for the request
     * @returns Contacts response
     */
    async getContacts(
        params: AwContactsQueryDto = {}, 
        accountId?: string
    ): Promise<BaseApiResponse<AwContactsResponse>> {
        try {
            console.log('=== Starting Contacts API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Set default parameters for pagination if not provided
            const requestParams = {
                page_num: 0,
                page_size: 100,
                ...params
            };

            // Build query params
            const queryParams = new URLSearchParams();
            Object.entries(requestParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => queryParams.append(key, v));
                    } else {
                        queryParams.append(key, String(value));
                    }
                }
            });

            // Construct request URL with query parameters
            const url = `${airwallexConfig.baseUrl}/api/v1/beneficiaries?${queryParams.toString()}`;
            console.log('Making request to Airwallex API:', url);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url,
                method: 'get',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-on-behalf-of': accountId
                },
                timeout: 10000,
                validateStatus: (status) => status === 200
            };

            // Make the API request
            const response = await axios.request(options);

            console.log('Contacts API response received with status:', response.status);

            // Validate the response
            if (response.data) {
                console.log('Contacts successfully retrieved');
                return {
                    success: true,
                    data: {
                        has_more: response.data.has_more || false,
                        items: response.data.items || [],
                        page_num: response.data.page_num,
                        page_size: response.data.page_size
                    } as AwContactsResponse,
                    message: "Contacts retrieved successfully"
                } as BaseApiResponse<AwContactsResponse>;
            } else {
                throw new InternalServerErrorException('API did not provide a valid response.');
            }

        } catch (error: any) {
            // Log error details
            console.error('Error fetching contacts:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            
            return {
                success: false,
                data: null,
                message: `Failed to fetch contacts: ${error.message}`
            } as BaseApiResponse<AwContactsResponse>;
        }
    }

    /**
     * Get a specific contact by ID
     * @param contactId The ID of the contact to retrieve
     * @param accountId The ID of the account to retrieve
     * @returns Contact details response
     */
    async getContactById(
        contactId: string, 
        accountId?: string
    ): Promise<BaseApiResponse<AwContactDetail>> {
        try {
            if (!contactId) {
                throw new Error('Contact ID is required');
            }

            console.log(`=== Starting Contact Detail API Call for ID: ${contactId} ===`);

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: false });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            console.log(`Making Airwallex API request for contact ID ${contactId}`);

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/beneficiaries/${contactId}`,
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

            console.log('Contact Detail API response received with status:', response.status);

            // Validate the response
            if (response.data && response.data.id) {
                console.log('Contact details successfully retrieved for ID:', contactId);
                return {
                    success: true,
                    data: response.data as AwContactDetail,
                    message: "Contact details retrieved successfully"
                } as BaseApiResponse<AwContactDetail>;
            } else {
                throw new InternalServerErrorException('API did not provide a valid response. Contact data not found.');
            }

        } catch (error: any) {
            // Log error details
            console.error(`Error retrieving contact details for ID ${contactId}:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            
            return {
                success: false,
                data: null,
                message: `Failed to retrieve contact details: ${error.message}`
            } as BaseApiResponse<AwContactDetail>;
        }
    }

    /**
     * Create a new beneficiary/contact
     * @param beneficiaryData The beneficiary creation data
     * @param accountId The account ID to use for the request
     * @returns Beneficiary creation response
     */
    async createBeneficiary(
        beneficiaryData: AwContactCreateRequest,
        accountId?: string
    ): Promise<BaseApiResponse<AwContactCreateResponse>> {
        try {
            console.log('=== Starting Beneficiary Creation API Call ===');

            // Retrieve the authentication token
            console.log('Retrieving auth token...');
            const token = await this.authService.getAuthToken({ forceNew: true });
            if (!token) {
                throw new UnauthorizedException('Authentication token is null or undefined');
            }
            console.log('Token obtained successfully');

            // Log the beneficiary creation request (masking sensitive data)
            console.log('Creating Airwallex beneficiary with data:', {
                ...beneficiaryData,
                beneficiary: {
                    ...beneficiaryData.beneficiary,
                    bank_details: beneficiaryData.beneficiary.bank_details ? {
                        ...beneficiaryData.beneficiary.bank_details,
                        // Mask account details in logs
                        account_number: beneficiaryData.beneficiary.bank_details.account_number ? 
                            `***${beneficiaryData.beneficiary.bank_details.account_number.substring(
                                Math.max(0, beneficiaryData.beneficiary.bank_details.account_number.length - 4))}` : undefined,
                        iban: beneficiaryData.beneficiary.bank_details.iban ?
                            `***${beneficiaryData.beneficiary.bank_details.iban.substring(
                                Math.max(0, beneficiaryData.beneficiary.bank_details.iban.length - 4))}` : undefined,
                    } : {}
                }
            });

            // Prepare Axios request options
            const options: AxiosRequestConfig = {
                url: `${airwallexConfig.baseUrl}/api/v1/beneficiaries/create`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-on-behalf-of': accountId
                },
                data: beneficiaryData,
                validateStatus: (status) => status === 200 || status === 201
            };

            // Make the API request
            const response = await axios.request(options);

            console.log('Beneficiary Creation API response received with status:', response.status);

            // Validate the response
            if (response.data && response.data.id) {
                console.log('Beneficiary created successfully:', {
                    id: response.data.id,
                    status: response.data.status,
                    nickname: response.data.nickname
                });
                return {
                    success: true,
                    data: response.data as AwContactCreateResponse,
                    message: "Beneficiary created successfully"
                } as BaseApiResponse<AwContactCreateResponse>;
            } else {
                throw new InternalServerErrorException('API did not provide a valid response. Beneficiary ID not found.');
            }

        } catch (error: any) {
            // Log error details
            console.error('Error creating Airwallex beneficiary:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            
            return {
                success: false,
                data: null,
                message: `Failed to create beneficiary: ${error.message}`
            } as BaseApiResponse<AwContactCreateResponse>;
        }
    }
} 