import {ApiProperty} from "@nestjs/swagger";
import {UserResponseDto} from "./user-response-dto";

export class UserListResponseDto {
    @ApiProperty({type: [UserResponseDto]})
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

