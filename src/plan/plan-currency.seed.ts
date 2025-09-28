import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanCurrencyRateEntity } from '../entities/plan-currency-rate.entity';
import { PlanEntity } from './plan.entity';
import { CurrencyGroupEntity } from '../entities/currency-group.entity';

@Injectable()
export class PlanCurrencySeedService {
  constructor(
    @InjectRepository(PlanCurrencyRateEntity)
    private readonly planRateRepo: Repository<PlanCurrencyRateEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
    @InjectRepository(CurrencyGroupEntity)
    private readonly currencyGroupRepo: Repository<CurrencyGroupEntity>,
  ) {}

  async seed(): Promise<void> {
    try {
      // Get all plans and currency groups
      const plans = await this.planRepo.find({ where: { isActive: true } });
      const currencyGroups = await this.currencyGroupRepo.find({ where: { isActive: true } });

      if (plans.length === 0) {
        console.log('⚠️  No active plans found. Please seed plans first.');
        return;
      }

      if (currencyGroups.length === 0) {
        console.log('⚠️  No active currency groups found. Please seed currency groups first.');
        return;
      }

      console.log(`🌱 Seeding currency rates for ${plans.length} plans and ${currencyGroups.length} currency groups...`);

      // Default rates based on plan level (Bronze, Silver, Gold)
      const defaultRates = {
        Bronze: { awRate: 2.0, mpRate: 0.5 },   // Level 1: Lower MP rate
        Silver: { awRate: 2.0, mpRate: 0.75 },  // Level 2: Medium MP rate
        Gold: { awRate: 2.0, mpRate: 1.0 },     // Level 3: Higher MP rate
      };

      let createdCount = 0;
      let skippedCount = 0;

      for (const plan of plans) {
        for (const group of currencyGroups) {
          // Check if rate already exists
          const existingRate = await this.planRateRepo.findOne({
            where: { planId: plan.id, groupId: group.id }
          });

          if (existingRate) {
            skippedCount++;
            continue;
          }

          // Get default rates for this plan
          const rates = defaultRates[plan.name as keyof typeof defaultRates] || defaultRates.Bronze;
          const conversionRate = rates.awRate + rates.mpRate;

          const planRate = this.planRateRepo.create({
            planId: plan.id!,
            groupId: group.id!,
            conversionRate,
            awRate: rates.awRate,
            mpRate: rates.mpRate,
            isActive: true,
            notes: `Default rate for ${plan.name} plan and ${group.name} group`
          });

          await this.planRateRepo.save(planRate);
          createdCount++;
          console.log(`✅ Created rate: ${plan.name} - ${group.name} (${conversionRate}%)`);
        }
      }

      console.log(`🎉 Plan currency rates seeding completed!`);
      console.log(`   - Created: ${createdCount} rates`);
      console.log(`   - Skipped: ${skippedCount} existing rates`);
    } catch (error) {
      console.error('❌ Error seeding plan currency rates:', error);
    }
  }

  async clear(): Promise<void> {
    await this.planRateRepo.clear();
    console.log('🗑️  All plan currency rates cleared');
  }
}

