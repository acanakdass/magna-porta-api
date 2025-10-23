import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AwFileUploadRequestDto {
  @ApiPropertyOptional({
    description: 'The notes of the uploaded file',
    maxLength: 50,
    example: 'business_log'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  notes?: string;
}
