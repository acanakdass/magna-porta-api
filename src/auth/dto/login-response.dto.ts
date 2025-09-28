import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto{
    @ApiProperty({ description: 'JWT Access Token for authentication', example: 'ey123...' })
    access_token!: string;
    
    @ApiProperty({ description: 'Refresh Token for getting new access tokens', example: 'refresh_ey123...' })
    refresh_token!: string;
  }