import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';

@Injectable()
export class RefreshTokenService {
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_default';
  private redis = new Redis();

  generateToken(payload: any) {
    const token = jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
    this.redis.set(token, 'valid', 'EX', 7 * 24 * 60 * 60); // expire in 7 days
    return token;
  }

  async verifyToken(token: string) {
    const exists = await this.redis.get(token);
    if (!exists) throw new Error('Invalid or expired refresh token');
    return jwt.verify(token, this.refreshSecret);
  }

  async revokeToken(token: string) {
    await this.redis.del(token);
  }
}
