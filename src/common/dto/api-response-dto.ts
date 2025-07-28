import { ApiProperty } from "@nestjs/swagger";


export class BaseApiResponse<T = any> {
    @ApiProperty({ description: 'Indicates if the request was successful' })
    success: boolean;
    @ApiProperty({ description: 'Response data', type: Object, required: false })
    data?: T;
    @ApiProperty({ description: 'Response message', example: 'Operation succeeded' })
    message?: string;
}