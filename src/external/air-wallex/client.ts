import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { airwallexConfig } from './config';
import {AwAuthResponse} from "./dtos/aw-auth-dtos/aw-auth-response";
/**
 * Base Airwallex API client
 */
export class AirwallexClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = airwallexConfig.baseUrl;
  }
  /**
   * Get the headers required for Airwallex API requests
   * @param onBehalfOf Optional parameter for acting on behalf of another user
   */
  async getAuthHeaders(onBehalfOf?: string): Promise<Record<string, string>> {
    const token = await this.getToken();

    return {
      Authorization: `Bearer ${token}`,
      'x-api-key': airwallexConfig.apiKey,
      'x-client-id': airwallexConfig.clientId,
      'Content-Type': 'application/json',
    };
  }

  async getToken():Promise<AwAuthResponse>{
    const axiosInstance = axios.create({ timeout: 10000 });

    const response = await axiosInstance.post<AwAuthResponse>(
        `${airwallexConfig.baseUrl}/api/v1/authentication/login`,
        {},
        {
          headers: {
            'x-api-key': airwallexConfig.apiKey,
            'x-client-id': airwallexConfig.clientId,
            'Content-Type': 'application/json',
          },
        }
    );
    return  response.data;
  }
  /**
   * Make an authenticated request to the Airwallex API
   */
  async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    additionalConfig: Partial<AxiosRequestConfig> = {}
  ): Promise<T> {
    try {
      const onBehalfOf = additionalConfig.headers?.['x-on-behalf-of'] as string;
      const authHeaders = await this.getAuthHeaders(onBehalfOf);
      
      // Remove x-on-behalf-of from additionalConfig.headers to avoid duplication
      if (additionalConfig.headers) {
        delete (additionalConfig.headers as any)['x-on-behalf-of'];
      }
      
      // Create merged headers
      const mergedHeaders = {
        ...authHeaders,
        ...(additionalConfig.headers || {}),
      };
      
      // Log the headers for debugging (excluding sensitive information)
      // console.log('Request headers:', {
      //   ...Object.keys(mergedHeaders).reduce((acc, key) => {
      //     if (key === 'Authorization') {
      //       acc[key] = 'Bearer [REDACTED]';
      //     } else if (key === 'x-api-key') {
      //       acc[key] = '[REDACTED]';
      //     } else {
      //       acc[key] = mergedHeaders[key];
      //     }
      //     return acc;
      //   }, {} as Record<string, string>),
      // });
      
      const config: AxiosRequestConfig = {
        url: `${this.baseUrl}${endpoint}`,
        method,
        headers: mergedHeaders,
        ...additionalConfig
      };
      
      if (data) {
        config.data = data;
      }
      
      console.log(`Making ${method.toUpperCase()} request to ${endpoint}`);
      const response: AxiosResponse<T> = await axios(config);
      // console.log(`Response received from ${endpoint}:`, response.status);
      
      return response.data;
    } catch (error: any) {
      console.error(`Error in Airwallex API request to ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Make a GET request to the Airwallex API
   */
  async get<T>(endpoint: string, params?: any, additionalConfig: Partial<AxiosRequestConfig> = {}): Promise<T> {
    return this.request<T>('get', endpoint, undefined, { params, ...additionalConfig });
  }
  
  /**
   * Make a POST request to the Airwallex API
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('post', endpoint, data);
  }
  
  /**
   * Make a PUT request to the Airwallex API
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('put', endpoint, data);
  }
  
  /**
   * Make a DELETE request to the Airwallex API
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('delete', endpoint);
  }
}
