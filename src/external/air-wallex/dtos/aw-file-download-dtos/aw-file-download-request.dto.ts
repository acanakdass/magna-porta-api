import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional } from 'class-validator';

export class AwFileDownloadRequestDto {
  @ApiProperty({
    description: 'List of file IDs to retrieve download links for',
    type: [String],
    example: ['2604d9d5-63d1-46c4-8591-1915a6a873bc']
  })
  @IsArray()
  @IsString({ each: true })
  file_ids: string[];

  @ApiProperty({
    description: 'Optional parameter for acting on behalf of another user/account',
    required: false,
    example: 'account-123'
  })
  @IsOptional()
  @IsString()
  onBehalfOf?: string;
}
