import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from './plan.entity';

@Injectable()
export class PlanSeedService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
  ) {}

  async seed(): Promise<void> {
    const plans = [
      {
        name: 'Bronze',
        description: 'Basic plan with essential features',
        level: 1,
        monthlyPrice: 29.99,
        annualPrice: 299.99,
        maxUsers: 10,
        maxTransactionsPerMonth: 1000,
        isActive: true,
        icon: 'shield',
        color: '#CD7F32',
      },
      {
        name: 'Silver',
        description: 'Standard plan with enhanced features',
        level: 2,
        monthlyPrice: 59.99,
        annualPrice: 599.99,
        maxUsers: 50,
        maxTransactionsPerMonth: 5000,
        isActive: true,
        icon: 'star',
        color: '#C0C0C0',
      },
      {
        name: 'Gold',
        description: 'Premium plan with advanced features and priority support',
        level: 3,
        monthlyPrice: 99.99,
        annualPrice: 999.99,
        maxUsers: 200,
        maxTransactionsPerMonth: 20000,
        isActive: true,
        icon: 'crown',
        color: '#FFD700',
      },
    ];

    for (const planData of plans) {
      const existingPlan = await this.planRepo.findOne({
        where: { name: planData.name }
      });

      if (!existingPlan) {
        const plan = this.planRepo.create(planData);
        await this.planRepo.save(plan);
        console.log(`✅ Created plan: ${planData.name}`);
      } else {
        console.log(`⚠️  Plan already exists: ${planData.name}`);
      }
    }
  }

  async clear(): Promise<void> {
    await this.planRepo.clear();
    console.log('🗑️  All plans cleared');
  }
}
