import {IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class PermissionCreateDto {
    @ApiProperty({
        description: 'Name of the permission',
        example: 'Create User'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

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
        example: 'create_user'
    })
    @IsString()
    @IsNotEmpty()
    key: string;
}

