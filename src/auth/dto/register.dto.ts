import {IsEmail, IsNotEmpty, IsOptional, IsString, MinLength} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Email of the user', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Password of the user', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ description: 'First name of the user', example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiProperty({ description: 'Phone number of the user', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Company Name', example: 'XYZ Tech Company' })
  @IsString()
  companyName?: string;
}
