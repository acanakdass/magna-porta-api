import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanTypeEntity } from './plan-type.entity';

@Injectable()
export class PlanTypeSeedService {
  constructor(
    @InjectRepository(PlanTypeEntity)
    private readonly planTypeRepo: Repository<PlanTypeEntity>,
  ) {}

  async seed(): Promise<void> {
    console.log('Starting plan type seed...');

    const planTypes = [
      {
        name: 'main',
        displayName: 'Main Plans',
        description: 'Standard plans provided by the system',
        isActive: true,
      },
      {
        name: 'custom',
        displayName: 'Custom Plans',
        description: 'Custom plans created by administrators',
        isActive: true,
      },
    ];

    for (const planTypeData of planTypes) {
      const existingPlanType = await this.planTypeRepo.findOne({
        where: { name: planTypeData.name, isDeleted: false }
      });

      if (!existingPlanType) {
        const planType = this.planTypeRepo.create(planTypeData);
        await this.planTypeRepo.save(planType);
        console.log(`Created plan type: ${planTypeData.name}`);
      } else {
        console.log(`Plan type already exists: ${planTypeData.name}`);
      }
    }

    console.log('Plan type seed completed!');
  }

  async clear(): Promise<void> {
    console.log('Clearing plan types...');
    
    // Soft delete all plan types
    await this.planTypeRepo.update({}, { isDeleted: true });
    
    console.log('Plan types cleared!');
  }
}



