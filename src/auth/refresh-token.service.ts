import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RefreshTokenService {
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_default';
  // Redis devre dışı - in-memory storage kullanıyoruz
  private validTokens = new Set<string>();

  generateToken(payload: any) {
    const token = jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
    // Token'ı memory'de sakla
    this.validTokens.add(token);
    
    // 7 gün sonra otomatik olarak sil (memory temizliği için)
    setTimeout(() => {
      this.validTokens.delete(token);
    }, 7 * 24 * 60 * 60 * 1000);
    
    return token;
  }

  async verifyToken(token: string) {
    // Memory'de token var mı kontrol et
    if (!this.validTokens.has(token)) {
      throw new Error('Invalid or expired refresh token');
    }
    
    // JWT token'ı verify et
    return jwt.verify(token, this.refreshSecret);
  }

  async revokeToken(token: string) {
    // Memory'den token'ı sil
    this.validTokens.delete(token);
  }
}
