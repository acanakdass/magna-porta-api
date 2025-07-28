import {IsOptional, IsString} from 'class-validator';
import {ApiProperty} from "@nestjs/swagger";

export class CreateRoleDto {
    @IsString()
    @ApiProperty({ description: 'Name of the role', example: 'Administrator' })
    name: string;

    @ApiProperty({ description: 'Desc of the role', example: 'Admin Rolü' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Keyword of the role', example: 'administrator' })
    @IsString()
    key!: string;
}
