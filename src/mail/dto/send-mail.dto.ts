import { IsString, IsArray, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsEmail()
  from?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];
}

export class SendTemplateMailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @IsString()
  subject: string;

  @IsString()
  template: string;

  @IsOptional()
  variables?: Record<string, any>;
}

export class SendForgotPasswordMailDto {
  @ApiProperty({
    description: 'Alıcı email adresi',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  toEmail: string;

  @ApiProperty({
    description: 'Mail konusu',
    example: 'Şifre Sıfırlama Kodu'
  })
  @IsString({ message: 'Konu metin olmalıdır' })
  subject: string;

  @ApiProperty({
    description: 'Şifre sıfırlama kodu',
    example: '123456'
  })
  @IsString({ message: 'Şifre kodu metin olmalıdır' })
  passcode: string;
}
