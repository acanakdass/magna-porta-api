import {ApiProperty} from "@nestjs/swagger";
import {TokenResponse} from "./token-response";

export class LoginResponse extends TokenResponse {
    @ApiProperty({
        description: 'User information',
        example: {
            id: 1,
            email: 'user@example.com',
            role: 'user'
        }
    })
    user: {
        id: number;
        email: string;
        role: string;
    };
}


