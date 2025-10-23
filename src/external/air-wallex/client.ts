import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { airwallexConfig } from './config';
import {AwAuthResponse} from "./dtos/aw-auth-dtos/aw-auth-response";
import { AwFileUploadResponseDto } from './dtos/aw-file-upload-dtos';
import { AwFileDownloadResponseDto, AwFileDownloadRequestDto } from './dtos/aw-file-download-dtos';
/**
 * Base Airwallex API client
 */
export class AirwallexClient {
  private baseUrl: string;
  
  constructor() {
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

    console.log('baseUrl', airwallexConfig.baseUrl);
    console.log('apiKey', airwallexConfig.apiKey);
    console.log('clientId', airwallexConfig.clientId);
    
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

  /**
   * Upload a file to Airwallex files API
   */
  async uploadFile(formData: FormData, queryParams: string = ''): Promise<AwFileUploadResponseDto> {
    try {
      const tokenResponse = await this.getToken();
      
      // Use files subdomain for file uploads
      const filesBaseUrl = airwallexConfig.baseUrl.replace('api', 'files');
      
      console.log('Uploading to URL:', `${filesBaseUrl}/api/v1/files/upload${queryParams}`);
      console.log('Token:', tokenResponse.token ? 'Present' : 'Missing');
      console.log('Bearer Token:', tokenResponse.token);
      
      const response = await axios.post<AwFileUploadResponseDto>(
        `${filesBaseUrl}/api/v1/files/upload${queryParams}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.token}`,
            'x-api-key': airwallexConfig.apiKey,
            'x-client-id': airwallexConfig.clientId,
            // Content-Type'ı kaldırıyoruz, axios otomatik ayarlayacak
          },
          timeout: 30000, // 30 seconds timeout for file uploads
        }
      );
      
      console.log('Upload response status:', response.status);
      console.log('Upload response data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error uploading file to Airwallex:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      throw error;
    }
  }

  /**
   * Get download links for files from Airwallex
   */
  async getFileDownloadLinks(fileIds: string[]): Promise<AwFileDownloadResponseDto> {
    try {
      const tokenResponse = await this.getToken();
      
      console.log('Getting download links for files:', fileIds);
      console.log('Token:', tokenResponse.token ? 'Present' : 'Missing');
      console.log('Bearer Token:', tokenResponse.token);
      
      const requestData: AwFileDownloadRequestDto = {
        file_ids: fileIds
      };
      
      console.log('Request data:', requestData);
      
      const response = await axios.post<AwFileDownloadResponseDto>(
        `${airwallexConfig.baseUrl}/api/v1/files/download_links`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.token}`,
            'x-api-key': airwallexConfig.apiKey,
            'x-client-id': airwallexConfig.clientId,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      console.log('Download links response status:', response.status);
      console.log('Download links response data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error getting file download links from Airwallex:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      throw error;
    }
  }
}
