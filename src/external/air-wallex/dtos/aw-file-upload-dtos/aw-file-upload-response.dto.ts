import { ApiProperty } from '@nestjs/swagger';

export class AwFileUploadResponseDto {
  @ApiProperty({
    description: 'Created time of file',
    example: 1640995200
  })
  created: number;

  @ApiProperty({
    description: 'ID of file, to be referenced in other endpoints',
    example: 'file_123456789'
  })
  file_id: string;

  @ApiProperty({
    description: 'Name of file',
    example: 'Document.pdf'
  })
  filename: string;

  @ApiProperty({
    description: 'Notes of file',
    example: 'business_log'
  })
  notes: string;

  @ApiProperty({
    description: 'Type of object. Can be file or list',
    example: 'file'
  })
  object_type: string;

  @ApiProperty({
    description: 'Size in bytes',
    example: 1024000
  })
  size: number;
}
