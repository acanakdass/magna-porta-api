import {BaseResponse} from "./base-response";
import {ApiProperty} from "@nestjs/swagger";
import {UserDto} from "./user-dto";
import {UserResponseDto} from "./user-response-dto";
import {UserEntity} from "../../users/user.entity";

export class UserResponse extends BaseResponse {
    @ApiProperty({type: UserDto})
    data: UserEntity;
}

export class UserListResponseDto {
    @ApiProperty({ type: [UserResponseDto] })
    items: UserResponseDto[];

    @ApiProperty({
        example: {
            totalItems: 100,
            itemsPerPage: 10,
            totalPages: 10,
            currentPage: 1
        }
    })
    meta: {
        totalItems: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}