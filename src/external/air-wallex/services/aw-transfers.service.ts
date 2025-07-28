import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { airwallexConfig } from '../config';
import { AwAuthService } from './aw-auth.service';
import { 
  AwTransfer, 
  AwTransfersResponse, 
  AwTransfersQueryDto,
  AwTransferCreateRequest,
  AwTransferCreateResponse
} from '../dtos/aw-transfers-dtos';

@Injectable()
export class AwTransfersService {
  private readonly logger = new Logger(AwTransfersService.name);
  private readonly client: AxiosInstance;
  private readonly maxRetries: number = 3;

  constructor(private readonly authService: AwAuthService) {
    this.client = axios.create({
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Get all transfers/payouts
   * @param params Query parameters for the request
   * @param accountId Optional account ID to use for the request
   * @param scaToken Optional SCA token to use for the request
   * @returns Promise resolving to AwTransfersResponse
   */
  async getTransfers(
    params: AwTransfersQueryDto = {}, 
    accountId?: string, 
    scaToken?: string
  ): Promise<AwTransfersResponse> {
    let retries = 0;
    let lastError: any = null;

    while (retries < this.maxRetries) {
      try {
        const token = await this.authService.getAuthToken({ forceNew: retries > 0 });
        
        if (!token) {
          throw new Error('Authentication token is null or undefined');
        }
        
        this.logger.log(`Making Airwallex Transfers API request (Attempt: ${retries + 1})`);
        
        // Create query parameters
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        
        // Set default page size if not provided
        if (!params.page_size) {
          queryParams.append('page_size', '100');
        }
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        
        const response = await this.client.request({
          url: `${airwallexConfig.baseUrl}/api/v1/transfers${queryString}`,
          method: 'get',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-on-behalf-of': accountId,
            'x-sca-token': scaToken
          },
        });
        
        if (response.status === 200) {
          this.logger.log('Transfers API response received successfully');
          return this.normalizeTransfersResponse(response.data);
        } else {
          throw new Error(`Unexpected status code: ${response.status}`);
        }
      } catch (error: any) {
        this.logger.error(`Error fetching transfers data (Attempt ${retries + 1}):`, error.message);
        if (error.response) {
          this.logger.error('Response status:', error.response.status);
          this.logger.error('Response data:', error.response.data);
        }
        
        lastError = error;
        
        // Check if the error is authentication-related
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          this.logger.log('Authentication error, clearing token cache and retrying...');
          this.authService.clearTokenCache();
        }
        
        retries++;
        
        if (retries < this.maxRetries) {
          // Wait for a bit before retrying (exponential backoff)
          const waitTime = Math.pow(2, retries) * 1000;
          this.logger.log(`Waiting ${waitTime}ms before retry ${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we've exhausted retries, throw the last error
    throw lastError || new Error('Failed to fetch transfers data after multiple retries');
  }

  /**
   * Create a new transfer/payout
   * @param data The transfer creation request data
   * @param accountId Optional account ID to use for the request
   * @returns Promise resolving to AwTransferCreateResponse
   */
  async createTransfer(
    data: AwTransferCreateRequest, 
    accountId?: string
  ): Promise<AwTransferCreateResponse> {
    let retries = 0;
    let lastError: any = null;

    while (retries < this.maxRetries) {
      try {
        const token = await this.authService.getAuthToken({ forceNew: retries > 0 });
        
        if (!token) {
          throw new Error('Authentication token is null or undefined');
        }
        
        // Create data structure based on transfer type
        let requestData: any;
        
        requestData = {
          beneficiary_id: data.beneficiary_id,
          reason: data.reason,
          reference: data.reference,
          request_id: data.request_id,
          source_currency: data.source_currency,
          transfer_amount: data.transfer_amount,
          transfer_currency: data.transfer_currency,
          transfer_date: data.transfer_date,
          transfer_method: data.transfer_method
        };
        
        // Add beneficiary details if provided
        if (data.beneficiary) {
          requestData.beneficiary = data.beneficiary;
        }
        
        // Add payer details
        if (data.payer) {
          requestData.payer = data.payer;
        }
        
        // Add metadata if provided
        if (data.metadata) {
          requestData.metadata = data.metadata;
        }
        
        // Add headers with optional SCA token if available
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-on-behalf-of': accountId
        };
        
        // Add SCA token to headers if available
        if (data.scaToken) {
          this.logger.log('Adding SCA token to headers:', data.scaToken.substring(0, 20) + '...');
          headers['x-sca-token'] = data.scaToken;
        }
        
        const response = await this.client.request({
          url: `${airwallexConfig.baseUrl}/api/v1/transfers/create`,
          method: 'post',
          headers,
          data: requestData,
          validateStatus: (status) => status === 201 || status === 200 // Accept both 201 (Created) and 200 (OK)
        });
        
        this.logger.log('Transfer created successfully');
        return response.data as AwTransferCreateResponse;
        
      } catch (error: any) {
        this.logger.error(`Error creating transfer (Attempt ${retries + 1}):`, error.message);
        lastError = error;
        
        // Check for SCA session code in headers when 403 error occurs
        let scaSessionCode: string | undefined;
        if (error.response?.status === 403 && error.response?.headers) {
          scaSessionCode = error.response.headers['x-sca-session-code'];
          this.logger.log('SCA Session Code:', scaSessionCode);
          
          // If this is a 403 with SCA session code, return it immediately
          if (scaSessionCode) {
            return {
              id: '',
              request_id: data.request_id,
              status: '403',
              created_at: new Date().toISOString(),
              success: false,
              message: error.response.data?.message || 'SCA authentication required',
              scaSessionCode: scaSessionCode
            } as any;
          }
        }
        
        // Check if the error is authentication-related
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          this.logger.log('Authentication error, clearing token cache and retrying...');
          this.authService.clearTokenCache();
        }
        
        // Log detailed response data if available
        if (error.response && error.response.data) {
          this.logger.error('API error response:', JSON.stringify(error.response.data, null, 2));
          
          // Specifically extract and log the errors array if it exists
          if (error.response.data.details && error.response.data.details.errors) {
            this.logger.error('Error details:');
            error.response.data.details.errors.forEach((err: any, index: number) => {
              this.logger.error(`Error ${index + 1}:`, JSON.stringify(err, null, 2));
            });
          }
        }
        
        retries++;
        
        if (retries < this.maxRetries) {
          // Wait for a bit before retrying (exponential backoff)
          const waitTime = Math.pow(2, retries) * 1000;
          this.logger.log(`Waiting ${waitTime}ms before retry ${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we've exhausted retries, throw the last error
    throw lastError || new Error('Failed to create transfer after multiple retries');
  }

  /**
   * Normalize the transfers response to ensure consistent structure
   * @param data Raw response data from Airwallex API
   * @returns Normalized AwTransfersResponse
   */
  private normalizeTransfersResponse(data: any): AwTransfersResponse {
    const response = new AwTransfersResponse();
    
    response.page_before = data.page_before;
    response.page_after = data.page_after;
    
    // Normalize items array
    if (Array.isArray(data.items)) {
      response.items = data.items.map((item: any) => this.normalizeTransfer(item));
    } else {
      response.items = [];
    }
    
    return response;
  }

  /**
   * Normalize a single transfer object
   * @param transfer Raw transfer data
   * @returns Normalized AwTransfer
   */
  private normalizeTransfer(transfer: any): AwTransfer {
    return {
      id: transfer.id || '',
      created_at: transfer.created_at || '',
      updated_at: transfer.updated_at || '',
      status: transfer.status || '',
      transfer_date: transfer.transfer_date || '',
      source_amount: transfer.source_amount || 0,
      source_currency: transfer.source_currency || '',
      transfer_amount: transfer.transfer_amount || 0,
      transfer_currency: transfer.transfer_currency || '',
      beneficiary: transfer.beneficiary || {},
      payer: transfer.payer,
      reference: transfer.reference,
      remarks: transfer.remarks,
      amount_beneficiary_receives: transfer.amount_beneficiary_receives,
      amount_payer_pays: transfer.amount_payer_pays,
      short_reference_id: transfer.short_reference_id,
      failure_reason: transfer.failure_reason,
      fee_amount: transfer.fee_amount,
      fee_currency: transfer.fee_currency
    };
  }
} 