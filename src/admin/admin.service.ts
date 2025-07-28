import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getDashboardStats() {
    return {
      users: 123,
      logs: 456,
      uptime: process.uptime(),
    };
  }
}