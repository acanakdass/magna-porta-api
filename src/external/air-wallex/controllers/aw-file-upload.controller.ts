import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  Query, 
  Body,
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiQuery,
  ApiBody 
} from '@nestjs/swagger';
import { AwFileUploadService } from '../services/aw-file-upload.service';
import { BaseApiResponse } from '../../../common/dto/api-response-dto';
import { AwFileUploadResponseDto, AwFileUploadRequestDto } from '../dtos/aw-file-upload-dtos';
import { AwFileDownloadResponseDto, AwFileDownloadRequestDto } from '../dtos/aw-file-download-dtos';

@ApiTags('Airwallex File Upload')
@Controller('airwallex/files')
export class AwFileUploadController {
  constructor(private readonly fileUploadService: AwFileUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
    fileFilter: (req, file, cb) => {
      console.log('Multer file filter - received file:', file);
      cb(null, true);
    }
  }))
  @ApiOperation({ 
    summary: 'Upload a file to Airwallex',
    description: 'Upload a file to Airwallex using the files.airwallex.com subdomain. Max file size is 20MB.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload form data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload (max 20MB, filename max 50 characters)'
        }
      },
      required: ['file']
    }
  })
  @ApiQuery({ 
    name: 'notes', 
    required: false, 
    description: 'The notes of the uploaded file (max 50 characters)',
    example: 'business_log'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    type: BaseApiResponse<AwFileUploadResponseDto>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid file or parameters' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many requests' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Service unavailable' 
  })
  async uploadFile(
    @UploadedFile() file: any,
    @Query('notes') notes?: string
  ): Promise<BaseApiResponse<AwFileUploadResponseDto>> {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Controller received file:', file);
    console.log('File type:', typeof file);
    console.log('File is null/undefined:', file === null || file === undefined);
    console.log('Controller received notes:', notes);
    console.log('========================');
    
    if (!file) {
      console.log('No file received in controller');
      throw new BadRequestException('No file provided');
    }

    return await this.fileUploadService.uploadFile(file, notes);
  }

  @Post('download-links')
  @ApiOperation({ 
    summary: 'Get download links for files',
    description: 'Get download links for files uploaded to Airwallex. Links are valid for 1 day.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Download links retrieved successfully',
    type: BaseApiResponse<AwFileDownloadResponseDto>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid file IDs' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'One or more files not found' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many requests' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Service unavailable' 
  })
  async getFileDownloadLinks(
    @Body() requestDto: AwFileDownloadRequestDto
  ): Promise<BaseApiResponse<AwFileDownloadResponseDto>> {
  

    return await this.fileUploadService.getFileDownloadLinks(requestDto.file_ids);
  }
}
