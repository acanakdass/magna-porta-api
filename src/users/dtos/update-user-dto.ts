import {ApiPropertyOptional, OmitType, PartialType} from "@nestjs/swagger";
import {IsOptional, IsString, Matches, MinLength} from "class-validator";
import {CreateUserDto} from "./create-user-dto";

export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['password'] as const)
) {
    @ApiPropertyOptional({
        description: 'Current password (required for password change)',
        example: 'CurrentPassword123!'
    })
    @IsString()
    @IsOptional()
    currentPassword?: string;

    @ApiPropertyOptional({
        description: 'New password',
        example: 'NewPassword123!'
    })
    @IsString()
    @IsOptional()
    @MinLength(8)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {message: 'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'}
    )
    password?: string;
}

