import {ApiProperty} from '@nestjs/swagger';

export class BaseResponse {
    @ApiProperty({
        description: 'Status of the operation',
        example: true
    })
    success: boolean;

    @ApiProperty({
        description: 'Message describing the result',
        example: 'Operation completed successfully'
    })
    message?: string;
}

