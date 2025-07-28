import {ApiProperty} from "@nestjs/swagger";
import {IsOptional, IsString} from "class-validator";

export class PermissionUpdateDto {
    @ApiProperty({
        description: 'ID of the permission to update',
        example: 'Update Permission Record',
        required: true
    })
    id!: number;

    @ApiProperty({
        description: 'Name of the permission',
        example: 'Create User',
        required: false
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'Description of the permission',
        example: 'Allows creating new users',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Unique key identifier for the permission',
        example: 'create_user',
        required: false
    })
    @IsString()
    @IsOptional()
    key?: string;
}