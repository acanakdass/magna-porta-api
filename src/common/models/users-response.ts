import {BaseResponse} from "./base-response";
import {ApiProperty} from "@nestjs/swagger";
import {UserDto} from "./user-dto";
import {UserEntity} from "../../users/user.entity";

export class UsersResponse extends BaseResponse {
    @ApiProperty({
        type: [UserEntity],
        description: 'Array of users'
    })
    data: UserEntity[];

    @ApiProperty({
        description: 'Pagination information',
        example: {
            total: 100,
            page: 1,
            limit: 10
        }
    })
    pagination?: {
        total: number;
        page: number;
        limit: number;
    };
}