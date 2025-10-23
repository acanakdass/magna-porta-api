import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AwFileDownloadRequestDto {
  @ApiProperty({
    description: 'List of file IDs to retrieve download links for',
    type: [String],
    example: ['2604d9d5-63d1-46c4-8591-1915a6a873bc']
  })
  @IsArray()
  @IsString({ each: true })
  file_ids: string[];
}
