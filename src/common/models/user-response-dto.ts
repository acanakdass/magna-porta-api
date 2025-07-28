import {Exclude, Expose} from "class-transformer";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

@Exclude()
export class UserResponseDto {
    @Expose()
    @ApiProperty({example: 1})
    id: number;

    @Expose()
    @ApiProperty({example: 'user@example.com'})
    email: string;

    @Expose()
    @ApiPropertyOptional({example: 'John'})
    firstName?: string;

    @Expose()
    @ApiPropertyOptional({example: 'Doe'})
    lastName?: string;

    @Expose()
    @ApiPropertyOptional({example: '+901234567890'})
    phoneNumber?: string;

    @Expose()
    @ApiProperty({example: 'user'})
    role: string;

    @Expose()
    @ApiProperty({example: true})
    isActive: boolean;

    @Expose()
    @ApiProperty({example: '2024-01-01T00:00:00.000Z'})
    createdAt: Date;

    @Expose()
    @ApiProperty({example: '2024-01-01T00:00:00.000Z'})
    updatedAt: Date;
}

