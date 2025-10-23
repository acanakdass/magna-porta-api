import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AirwallexClient } from '../client';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { AwFileUploadResponseDto, AwFileUploadRequestDto } from '../dtos/aw-file-upload-dtos';
import { AwFileDownloadResponseDto, AwFileDownloadRequestDto } from '../dtos/aw-file-download-dtos';

@Injectable()
export class AwFileUploadService {
  private client: AirwallexClient;

  constructor() {
    this.client = new AirwallexClient();
  }

  /**
   * Upload a file to Airwallex
   * @param file The file to upload (max 20MB)
   * @param notes Optional notes for the file (max 50 characters)
   * @returns Promise<BaseApiResponse<AwFileUploadResponseDto>>
   */
  async uploadFile(
    file: any,
    notes?: string
  ): Promise<BaseApiResponse<AwFileUploadResponseDto>> {
    try {
      console.log('File received:', {
        size: file?.size,
        originalname: file?.originalname,
        mimetype: file?.mimetype,
        buffer: file?.buffer ? 'Present' : 'Missing'
      });

      // Validate file size (20MB = 20 * 1024 * 1024 bytes)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('File size cannot exceed 20MB');
      }

      // Validate filename length (max 50 characters)
      if (file.originalname.length > 50) {
        throw new BadRequestException('Filename cannot exceed 50 characters');
      }

      // Validate notes length if provided (max 50 characters)
      if (notes && notes.length > 50) {
        throw new BadRequestException('Notes cannot exceed 50 characters');
      }

      // Prepare form data - file field'ı 'file' olmalı
      const formData = new FormData();
      formData.append('file', new Blob([file.buffer]), file.originalname);

      // Add notes as query parameter if provided
      const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';

      console.log('FormData prepared, uploading to Airwallex...');

      // Upload file to Airwallex
      const response = await this.client.uploadFile(formData, queryParams);

      if (!response) {
        throw new Error('No response received from Airwallex file upload API');
      }

      return {
        success: true,
        data: response,
        message: 'File uploaded successfully',
      };
    } catch (error: any) {
        console.log("errorerrrrrrr");
      console.error('Error uploading file to Airwallex:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Airwallex API hata yönetimi
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired Airwallex credentials');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.response?.data || 'Invalid file upload request';
        throw new BadRequestException(errorMessage);
      }

      if (error.response?.status === 429) {
        throw new BadRequestException('Too many requests. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new BadRequestException('Airwallex service is currently unavailable');
      }

      // JSON parse hatası için özel kontrol
      if (error.message && error.message.includes('JSON')) {
        throw new BadRequestException('Invalid response from Airwallex API');
      }

      throw new BadRequestException('Failed to upload file to Airwallex: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Get download links for files from Airwallex
   * @param fileIds Array of file IDs to get download links for
   * @returns Promise<BaseApiResponse<AwFileDownloadResponseDto>>
   */
  async getFileDownloadLinks(fileIds: string[]): Promise<BaseApiResponse<AwFileDownloadResponseDto>> {
    try {
      // Validate input
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        throw new BadRequestException('File IDs array is required and cannot be empty');
      }

      // Validate each file ID
      for (const fileId of fileIds) {
        if (!fileId || typeof fileId !== 'string' || fileId.trim().length === 0) {
          throw new BadRequestException('All file IDs must be valid non-empty strings');
        }
      }

      console.log('Getting download links for file IDs:', fileIds);

      // Get download links from Airwallex
      const response = await this.client.getFileDownloadLinks(fileIds);

      if (!response) {
        throw new Error('No response received from Airwallex download links API');
      }

      return {
        success: true,
        data: response,
        message: 'Download links retrieved successfully',
      };
    } catch (error: any) {
      console.error('Error getting file download links from Airwallex:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Airwallex API hata yönetimi
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired Airwallex credentials');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.response?.data || 'Invalid download links request';
        throw new BadRequestException(errorMessage);
      }

      if (error.response?.status === 404) {
        throw new BadRequestException('One or more files not found');
      }

      if (error.response?.status === 429) {
        throw new BadRequestException('Too many requests. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new BadRequestException('Airwallex service is currently unavailable');
      }

      throw new BadRequestException('Failed to get file download links from Airwallex: ' + (error.message || 'Unknown error'));
    }
  }
}
