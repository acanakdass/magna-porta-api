import { ApiProperty } from '@nestjs/swagger';

export class AwFileDownloadInfoDto {
  @ApiProperty({
    description: 'Content type of the file',
    example: 'application/octet-stream'
  })
  content_type: string;

  @ApiProperty({
    description: 'File download URL expiration date',
    example: '2022-01-18T21:38:52Z'
  })
  download_link_valid_until: string;

  @ApiProperty({
    description: 'File ID',
    example: 'YmVkODdkNGMtNWFiZC00MzM0LdGVzdC5wZGZfMTYxNTI2MDIxOQ=='
  })
  file_id: string;

  @ApiProperty({
    description: 'File name, if provided during upload',
    example: 'registration_certificate.pdf'
  })
  filename: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 120591
  })
  size: number;

  @ApiProperty({
    description: 'File download URL',
    example: 'https://airwallex-upload-shenzhen-dev.oss-accelerate.aliyuncs.com/...'
  })
  url: string;
}

export class AwFileDownloadResponseDto {
  @ApiProperty({
    description: 'File IDs that could not be found',
    type: [String],
    example: ['YmVkODdkNGMtNWFiZC00MzM0LdGVzdC5wZGZfMTYxNTI2MDIxOQ==']
  })
  absent_files: string[];

  @ApiProperty({
    description: 'File download links',
    type: [AwFileDownloadInfoDto]
  })
  files: AwFileDownloadInfoDto[];
}
