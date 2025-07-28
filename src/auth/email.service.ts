import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendVerification(email: string, token: string) {
    const link = `http://abc.com/verify?token=${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your account',
      text: `Click here to verify: ${link}`,
    });
  }

  async sendResetPassword(email: string, token: string) {
    const link = `http://abc.com/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your password',
      text: `Click here to reset: ${link}`,
    });
  }
}
