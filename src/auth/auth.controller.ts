import { Controller, Post, Body, HttpStatus, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { BaseApiResponse  } from "../common/dto/api-response-dto";
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {RegisterResponseDto} from "./dto/register-response.dto";
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: BaseApiResponse,
    schema: {
      example: {
        success: true,
        message: "Login Success",
        data: {
          access_token: "jwt_token_example_here"
        }
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: "Invalid credentials",
        error: "Unauthorized",
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<BaseApiResponse<LoginResponseDto>> {
    // console.log(loginDto);
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User Registration' })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'User registered successfully',
  //   type: BaseApiResponse,
  //   schema: {
  //     example: {
  //       success: true,
  //       message: "Registration Success",
  //       data: {
  //         email: "user@example.com",
  //         password: "hashed_password"
  //       }
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Validation failed',
  //   schema: {
  //     example: {
  //       statusCode: 400,
  //       message:"password must be at least 6 characters"
  //     },
  //   },
  // })
  async register(@Body() registerDto: RegisterDto): Promise<BaseApiResponse<RegisterResponseDto>> {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user by access token' })
  async me(@Req() req): Promise<BaseApiResponse<any>> {
    const { password, emailVerificationToken, resetPasswordToken, ...userData } = req.user;
    return {
      success: true,
      message: 'Current user fetched successfully',
      data: userData,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: BaseApiResponse<LoginResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Body() body: { refresh_token: string }): Promise<BaseApiResponse<LoginResponseDto>> {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    type: BaseApiResponse,
  })
  async logout(@Body() body: { refresh_token: string }): Promise<BaseApiResponse<null>> {
    return this.authService.logout(body.refresh_token);
  }
}