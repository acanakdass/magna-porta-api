import {ApiProperty} from "@nestjs/swagger";

export class UserDto {
    @ApiProperty({example: 1})
    id: number;

    @ApiProperty({example: 'user@example.com'})
    email: string;

    @ApiProperty({example: 'John'})
    firstName?: string;

    @ApiProperty({example: 'Doe'})
    lastName?: string;

    @ApiProperty({example: 'user'})
    role: string;

    @ApiProperty({example: '2024-01-01T00:00:00.000Z'})
    createdAt: Date;
}



