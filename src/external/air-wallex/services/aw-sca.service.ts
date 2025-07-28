import { Injectable, Logger } from '@nestjs/common';
import { AwAuthService } from './aw-auth.service';
import { AuthorizeService } from './aw-authorization.service';

export interface ScaTokenInfo {
  token: string;
  expiresAt: Date;
  sessionCode?: string;
}

@Injectable()
export class AwScaService {
  private readonly logger = new Logger(AwScaService.name);
  private scaTokenCache: Map<string, ScaTokenInfo> = new Map();

  constructor(
    private readonly authService: AwAuthService,
    private readonly authorizeService: AuthorizeService
  ) {}

  /**
   * Get SCA token or retrieve from cache
   * @param userId User ID
   * @param accountId Account ID
   * @param forceNew Force new token
   * @returns SCA token information
   */
  async getScaToken(userId: string, accountId?: string, forceNew: boolean = false): Promise<ScaTokenInfo> {
    const cacheKey = `${userId}_${accountId || 'default'}`;
    
    // Check from cache
    if (!forceNew) {
      const cached = this.scaTokenCache.get(cacheKey);
      if (cached && new Date() < cached.expiresAt) {
        this.logger.log(`Using cached SCA token for user ${userId}`);
        return cached;
      }
    }

    try {
      this.logger.log(`Requesting new SCA token for user ${userId}`);
      
      // Get authorization code
      const authResponse = await this.authorizeService.getAuthorizationCode('scaSetup', accountId);
      
      if (!authResponse.success || !authResponse.data) {
        throw new Error('Failed to get authorization code for SCA');
      }

      const scaToken = this.generateScaToken(authResponse.data.authorization_code);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const tokenInfo: ScaTokenInfo = {
        token: scaToken,
        expiresAt,
        sessionCode: authResponse.data.authorization_code
      };

      // Save to cache
      this.scaTokenCache.set(cacheKey, tokenInfo);
      
      this.logger.log(`SCA token generated and cached for user ${userId}`);
      return tokenInfo;

    } catch (error) {
      this.logger.error(`Error getting SCA token for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate SCA token
   * @param token SCA token
   * @param userId User ID
   * @returns Validation result
   */
  async validateScaToken(token: string, userId: string): Promise<boolean> {
    try {
      // Find token from cache
      for (const [key, tokenInfo] of this.scaTokenCache.entries()) {
        if (key.startsWith(userId) && tokenInfo.token === token) {
          // Time check
          if (new Date() < tokenInfo.expiresAt) {
            return true;
          } else {
            // Remove expired token from cache
            this.scaTokenCache.delete(key);
            return false;
          }
        }
      }
      return false;
    } catch (error) {
      this.logger.error(`Error validating SCA token for user ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Remove SCA token from cache
   * @param userId User ID
   * @param accountId Account ID
   */
  clearScaToken(userId: string, accountId?: string): void {
    const cacheKey = `${userId}_${accountId || 'default'}`;
    this.scaTokenCache.delete(cacheKey);
    this.logger.log(`SCA token cleared for user ${userId}`);
  }

  
  clearAllScaTokens(): void {
    this.scaTokenCache.clear();
    this.logger.log('All SCA tokens cleared from cache');
  }

  /**
   * @param authCode Authorization code
   * @returns SCA token
   */
  private generateScaToken(authCode: string): string {
    return `sca_${authCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @param userId 
   * @returns 
   */
  async checkScaSetupStatus(userId: string): Promise<boolean> {
    try {
      for (const [key] of this.scaTokenCache.entries()) {
        if (key.startsWith(userId)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error(`Error checking SCA setup status for user ${userId}:`, error.message);
      return false;
    }
  }
} 