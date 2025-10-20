import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber, IsObject, IsIn } from 'class-validator';

export class CreateLogDto {
  @ApiProperty({ 
    description: 'Log level', 
    enum: ['info', 'warn', 'error', 'debug', 'verbose'],
    example: 'info'
  })
  @IsEnum(['info', 'warn', 'error', 'debug', 'verbose'])
  level: 'info' | 'warn' | 'error' | 'debug' | 'verbose';

  @ApiProperty({ 
    description: 'Log message', 
    example: 'User login successful'
  })
  @IsString()
  message: string;

  @ApiProperty({ 
    description: 'Service name that generated the log', 
    example: 'auth-service'
  })
  @IsString()
  serviceName: string;

  @ApiPropertyOptional({ 
    description: 'HTTP method', 
    example: 'POST'
  })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ 
    description: 'Request URL', 
    example: '/api/auth/login'
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ 
    description: 'HTTP status code', 
    example: 200
  })
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiPropertyOptional({ 
    description: 'Error stack trace', 
    example: 'Error: Something went wrong\n    at function...'
  })
  @IsOptional()
  @IsString()
  errorStack?: string;

  @ApiPropertyOptional({ 
    description: 'User ID', 
    example: 123
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ 
    description: 'User role', 
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  userRole?: string;

  @ApiPropertyOptional({ 
    description: 'Client IP address', 
    example: '192.168.1.1'
  })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ 
    description: 'User agent string', 
    example: 'Mozilla/5.0...'
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ 
    description: 'Request headers', 
    example: { 'content-type': 'application/json' }
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ 
    description: 'Query parameters', 
    example: { 'page': '1', 'limit': '10' }
  })
  @IsOptional()
  @IsObject()
  queryParams?: Record<string, string>;

  @ApiPropertyOptional({ 
    description: 'Additional metadata', 
    example: { 'requestId': 'abc123', 'sessionId': 'xyz789' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Response body', 
    example: { 'success': true, 'data': {} }
  })
  @IsOptional()
  @IsObject()
  responseBody?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Transaction ID for tracking', 
    example: 'txn_123456789'
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ 
    description: 'Environment', 
    enum: ['development', 'production', 'staging'],
    example: 'production'
  })
  @IsOptional()
  @IsIn(['development', 'production', 'staging'])
  environment?: 'development' | 'production' | 'staging';

  @ApiPropertyOptional({ 
    description: 'Execution time in milliseconds', 
    example: 150
  })
  @IsOptional()
  @IsNumber()
  executionTime?: number;
}
