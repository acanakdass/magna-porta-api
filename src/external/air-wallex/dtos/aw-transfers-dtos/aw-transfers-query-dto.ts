import { IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AwTransfersQueryDto {
  @ApiPropertyOptional({ description: 'From created date (ISO 8601)' })
  @IsOptional()
  @IsString()
  from_created_at?: string;

  @ApiPropertyOptional({ description: 'To created date (ISO 8601)' })
  @IsOptional()
  @IsString()
  to_created_at?: string;

  @ApiPropertyOptional({ description: 'Transfer status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Transfer currency filter' })
  @IsOptional()
  @IsString()
  transfer_currency?: string;

  @ApiPropertyOptional({ description: 'Short reference ID filter' })
  @IsOptional()
  @IsString()
  short_reference_id?: string;

  @ApiPropertyOptional({ description: 'Page cursor' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: 'Page size', default: 100 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  page_size?: number = 100;

  @ApiPropertyOptional({ description: 'Request ID filter' })
  @IsOptional()
  @IsString()
  request_id?: string;
} 