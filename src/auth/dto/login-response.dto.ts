import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto{
    @ApiProperty({ description: 'JWT Access Token for authentication', example: 'ey123...' })
    access_token!: string;
  }