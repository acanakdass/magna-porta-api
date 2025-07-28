import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

const ipRequestMap = new Map<string, { count: number, last: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly maxRequests = 5;
  private readonly windowMs = 60 * 1000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip;

    const now = Date.now();
    const record = ipRequestMap.get(ip) || { count: 0, last: now };

    if (now - record.last > this.windowMs) {
      record.count = 1;
      record.last = now;
    } else {
      record.count += 1;
    }

    ipRequestMap.set(ip, record);

    if (record.count > this.maxRequests) {
      throw new BadRequestException('Too many requests, please try again later.');
    }

    return true;
  }
}
