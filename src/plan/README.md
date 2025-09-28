# Plan System

This module implements a dynamic plan system for companies with Bronze, Silver, and Gold plans.

## Features

- **Dynamic Plan Management**: Create, update, and delete plans with customizable names and properties
- **Company-Plan Relationship**: Assign and manage plans for companies
- **Plan Properties**: Each plan can have pricing, user limits, transaction limits, and more
- **Flexible Configuration**: Easy to add new plans or modify existing ones

## Database Structure

### Plan Entity
- `id`: Primary key
- `name`: Plan name (e.g., Bronze, Silver, Gold)
- `description`: Plan description
- `level`: Numeric level for ordering (1 = Bronze, 2 = Silver, 3 = Gold)
- `monthlyPrice`: Monthly subscription price
- `annualPrice`: Annual subscription price
- `maxUsers`: Maximum number of users allowed
- `maxTransactionsPerMonth`: Monthly transaction limit
- `isActive`: Whether the plan is available for assignment

### Company Entity (Updated)
- `planId`: Foreign key to the assigned plan
- `plan`: Relationship to the PlanEntity

## API Endpoints

### Plan Management

#### Get All Plans (Paginated)
```
GET /plans?page=1&limit=10
```

#### Get Active Plans
```
GET /plans/active
```

#### Get All Plans (No Pagination)
```
GET /plans/all
```

#### Get Plan by ID
```
GET /plans/:id
```

#### Create Plan
```
POST /plans
Content-Type: application/json

{
  "name": "Platinum",
  "description": "Ultimate plan with all features",
  "level": 4,
  "monthlyPrice": 199.99,
  "annualPrice": 1999.99,
  "maxUsers": 500,
  "maxTransactionsPerMonth": 50000,
  "isActive": true
}
```

#### Update Plan
```
PATCH /plans/:id
Content-Type: application/json

{
  "monthlyPrice": 149.99,
  "description": "Updated description"
}
```

#### Delete Plan
```
DELETE /plans/:id
```

#### Get Companies by Plan
```
GET /plans/:id/companies?page=1&limit=10
```

### Company Plan Management

#### Assign Plan to Company
```
POST /companies/:companyId/plan
Content-Type: application/json

{
  "planId": 3
}
```

#### Remove Plan from Company
```
DELETE /companies/:companyId/plan
```

### Plan Currency Rates Management

#### Get All Plan Currency Rates (Paginated)
```
GET /plan-currency-rates?page=1&limit=10
```

#### Get All Plan Currency Rates (No Pagination)
```
GET /plan-currency-rates/all
```

#### Get Currency Rates for Specific Plan
```
GET /plan-currency-rates/plan/:planId
```

#### Get Plan Currency Rate by ID
```
GET /plan-currency-rates/:id
```

#### Create Plan Currency Rate
```
POST /plan-currency-rates
Content-Type: application/json

{
  "planId": 1,
  "groupId": 1,
  "conversionRate": 2.75,
  "awRate": 2.0,
  "mpRate": 0.75,
  "isActive": true,
  "notes": "Special rate for Bronze plan"
}
```

#### Update Plan Currency Rate
```
PATCH /plan-currency-rates/:id
Content-Type: application/json

{
  "mpRate": 1.0,
  "notes": "Updated rate"
}
```

#### Delete Plan Currency Rate
```
DELETE /plan-currency-rates/:id
```

#### Bulk Create Plan Currency Rates
```
POST /plan-currency-rates/bulk
Content-Type: application/json

{
  "planId": 1,
  "rates": [
    {
      "groupId": 1,
      "conversionRate": 2.5,
      "awRate": 2.0,
      "mpRate": 0.5
    },
    {
      "groupId": 2,
      "conversionRate": 2.75,
      "awRate": 2.0,
      "mpRate": 0.75
    }
  ]
}
```

## Seeding

To seed the initial Bronze, Silver, and Gold plans with their currency rates:

```bash
npx ts-node src/plan/seed-plans.ts
```

This will create:
- Bronze, Silver, Gold plans
- Default currency rates for each plan and currency group combination
- Different MP rates based on plan level (Bronze: 0.5%, Silver: 0.75%, Gold: 1.0%)

## Default Plans

### Bronze (Level 1)
- Monthly: $29.99
- Annual: $299.99
- Max Users: 10
- Max Transactions/Month: 1,000

### Silver (Level 2)
- Monthly: $59.99
- Annual: $599.99
- Max Users: 50
- Max Transactions/Month: 5,000

### Gold (Level 3)
- Monthly: $99.99
- Annual: $999.99
- Max Users: 200
- Max Transactions/Month: 20,000

## Usage Examples

### Creating a New Plan
```typescript
const newPlan = await planService.createPlan({
  name: 'Enterprise',
  description: 'Enterprise plan for large organizations',
  level: 4,
  monthlyPrice: 299.99,
  annualPrice: 2999.99,
  maxUsers: 1000,
  maxTransactionsPerMonth: 100000,
  isActive: true
});
```

### Assigning a Plan to a Company
```typescript
await planService.assignPlanToCompany(companyId, planId);
```

### Getting Company with Plan Information
```typescript
const company = await companiesService.getCompanyWithPlan(companyId);
console.log(company.plan?.name); // "Gold"
```

## Security

- All plan management endpoints require admin or super_admin roles
- Company plan assignment endpoints require admin or super_admin roles
- JWT authentication is required for all endpoints

## Future Enhancements

- Plan-based feature flags
- Automatic plan upgrades/downgrades based on usage
- Plan usage analytics and reporting
- Custom plan configurations per company
- Plan expiration and renewal management