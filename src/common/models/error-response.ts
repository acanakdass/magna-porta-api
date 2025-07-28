import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {BaseResponse} from "./base-response";

export class ErrorResponse extends BaseResponse {
    @ApiProperty({
        description: 'Error code',
        example: 'UNAUTHORIZED_ERROR'
    })
    errorCode?: string;

    @ApiProperty({
        description: 'Detailed error information',
        example: {field: 'email', message: 'Email is invalid'}
    })
    errors?: Record<string, any>;
}

