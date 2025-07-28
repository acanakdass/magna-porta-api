import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { airwallexConfig } from '../config';
import { AwAuthService } from './aw-auth.service';
import { 
  AwTransaction, 
  AwTransactionsResponse, 
  AwTransactionsQueryDto 
} from '../dtos/aw-transactions-dtos';

@Injectable()
export class AwTransactionsService {
  private readonly logger = new Logger(AwTransactionsService.name);
  private readonly maxRetries: number = 3;

  constructor(private readonly authService: AwAuthService) {}

  /**
   * Get card transactions
   * @param params Query parameters for filtering transactions
   * @param accountId Optional account ID to use for the request
   * @returns Promise resolving to AwTransactionsResponse
   */
  async getTransactions(
    params: AwTransactionsQueryDto = {}, 
    accountId?: string
  ): Promise<AwTransactionsResponse> {
    let retries = 0;
    let lastError: any = null;

    while (retries < this.maxRetries) {
      try {
        const token = await this.authService.getAuthToken({ forceNew: retries > 0 });
        
        if (!token) {
          throw new Error('Authentication token is null or undefined');
        }
        
        this.logger.log(`Making Airwallex Transactions API request (Attempt: ${retries + 1})`);
        
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
        const url = `${airwallexConfig.baseUrl}/api/v1/issuing/transactions${queryString}`;
        
        this.logger.log('Requesting transactions from URL:', url);
        
        // Create request config
        const config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: url,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-on-behalf-of': accountId
          }
        };
        
        // Make the request
        const response = await axios.request(config);
        
        if (response.status === 200) {
          this.logger.log('Transactions API response received successfully');
          return this.normalizeTransactionsResponse(response.data);
        } else {
          throw new Error(`Unexpected status code: ${response.status}`);
        }
      } catch (error: any) {
        this.logger.error(`Error fetching transactions data (Attempt ${retries + 1}):`, error.message);
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
    throw lastError || new Error('Failed to fetch transactions data after multiple retries');
  }

  /**
   * Normalize the transactions response to ensure consistent structure
   * @param data Raw response data from Airwallex API
   * @returns Normalized AwTransactionsResponse
   */
  private normalizeTransactionsResponse(data: any): AwTransactionsResponse {
    const response = new AwTransactionsResponse();
    
    response.has_more = data.has_more || false;
    response.page_num = data.page_num || 0;
    response.page_size = data.page_size || 100;
    
    // Normalize items array
    if (Array.isArray(data.items)) {
      response.items = data.items.map((item: any) => this.normalizeTransaction(item));
    } else {
      response.items = [];
    }
    
    return response;
  }

  /**
   * Normalize a single transaction object
   * @param transaction Raw transaction data
   * @returns Normalized AwTransaction
   */
  private normalizeTransaction(transaction: any): AwTransaction {
    return {
      billing_amount: transaction.billing_amount || 0,
      billing_currency: transaction.billing_currency || '',
      card_id: transaction.card_id || '',
      created_at: transaction.created_at || '',
      digital_wallet_token_id: transaction.digital_wallet_token_id,
      lifecycle_id: transaction.lifecycle_id || '',
      merchant_city: transaction.merchant_city,
      merchant_country: transaction.merchant_country,
      merchant_name: transaction.merchant_name,
      settlement_amount: transaction.settlement_amount,
      settlement_currency: transaction.settlement_currency,
      transaction_id: transaction.transaction_id || '',
      transaction_status: transaction.transaction_status || '',
      transaction_type: transaction.transaction_type || '',
      updated_at: transaction.updated_at || ''
    };
  }
} 