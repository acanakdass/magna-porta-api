import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateTableRowDto {
  @ApiProperty({ example: 'Short Ref' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: '{{shortReferenceId}}' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpsertTemplateDto {
  @ApiProperty({ example: 'conversion.settled' })
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiProperty({ enum: ['email', 'sms', 'web', 'slack', 'internal'], example: 'email' })
  @IsEnum(['email', 'sms', 'web', 'slack', 'internal'] as const)
  channel: 'email' | 'sms' | 'web' | 'slack' | 'internal';

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({ example: 'Your conversion is settled' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ example: 'Conversion Settled' })
  @IsString()
  @IsOptional()
  header?: string;

  @ApiPropertyOptional({ example: 'Thanks for using Magna Porta' })
  @IsString()
  @IsOptional()
  subtext1?: string;

  @ApiPropertyOptional({ example: 'Below is your summary' })
  @IsString()
  @IsOptional()
  subtext2?: string;

  @ApiPropertyOptional({ example: '#28a745' })
  @IsString()
  @IsOptional()
  mainColor?: string;

  @ApiProperty({ example: '<p>Body HTML here...</p>' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TemplateTableRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateTableRowDto)
  @IsOptional()
  tableRowsJson?: TemplateTableRowDto[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'conversion.settled' })
  @IsString()
  @IsOptional()
  eventName?: string;

  @ApiPropertyOptional({ enum: ['email', 'sms', 'web', 'slack', 'internal'], example: 'email' })
  @IsEnum(['email', 'sms', 'web', 'slack', 'internal'] as const)
  @IsOptional()
  channel?: 'email' | 'sms' | 'web' | 'slack' | 'internal';

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({ example: 'Your conversion is settled' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ example: 'Conversion Settled' })
  @IsString()
  @IsOptional()
  header?: string;

  @ApiPropertyOptional({ example: 'Thanks for using Magna Porta' })
  @IsString()
  @IsOptional()
  subtext1?: string;

  @ApiPropertyOptional({ example: 'Below is your summary' })
  @IsString()
  @IsOptional()
  subtext2?: string;

  @ApiPropertyOptional({ example: '#28a745' })
  @IsString()
  @IsOptional()
  mainColor?: string;

  @ApiPropertyOptional({ example: '<p>Body HTML here...</p>' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TemplateTableRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateTableRowDto)
  @IsOptional()
  tableRowsJson?: TemplateTableRowDto[];
}

export class RenderTemplateBodyDto {
  @ApiProperty({ type: 'object', example: {
    shortReferenceId: 'SR-2025-000123',
    status: 'Settled',
    buyAmount: '10,000',
    buyCurrency: 'USD',
    sellAmount: '9,250',
    sellCurrency: 'EUR',
    clientRate: '1.0811',
    conversionDate: '2025-09-07'
  } })
  data?: Record<string, any>;
}


