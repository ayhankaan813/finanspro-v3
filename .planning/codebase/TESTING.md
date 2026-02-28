# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:**
- Vitest 1.4.0 (backend only)
- Config: No explicit `vitest.config.ts` found; uses defaults
- Frontend: No test runner configured (no test scripts in package.json)

**Assertion Library:**
- Vitest built-in expect API (Chai-compatible)
- No separate assertion library configured

**Run Commands:**
```bash
# Backend tests (from apps/backend/)
npm run test              # Run all tests
npm run test:coverage     # Run with coverage report
npm run lint              # ESLint validation

# Frontend
npm run lint              # ESLint validation (no tests configured)
```

**Database Testing:**
```bash
# Reset test database to clean state
cd apps/backend
npx prisma db push --force-reset --accept-data-loss

# Seed test data
node --import tsx prisma/seed.ts

# View database
npx prisma studio
```

## Test File Organization

**Location:**
- NO test files currently exist in the codebase
- Recommended: Co-located with source files using `.test.ts` or `.spec.ts` suffix
- Or separate `__tests__/` directory per module

**Naming:**
- Recommended: `{service|controller|utils}.test.ts` for unit tests
- Example: `organization.service.test.ts`, `decimal.test.ts`, `errors.test.ts`
- Pattern: match the name of the file being tested

**Structure (Recommended):**
```
modules/
├── transaction/
│   ├── transaction.service.ts
│   ├── transaction.service.test.ts     ← Co-located
│   ├── transaction.controller.ts
│   ├── transaction.controller.test.ts  ← Co-located
│   ├── transaction.schema.ts
│   └── transaction.routes.ts
│
└── organization/
    ├── organization.service.ts
    ├── organization.service.test.ts    ← Co-located
    └── organization.controller.ts

shared/
├── utils/
│   ├── decimal.ts
│   ├── decimal.test.ts                 ← Co-located
│   ├── errors.ts
│   └── errors.test.ts
```

## Test Structure

**Suite Organization (Recommended):**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrganizationService } from './organization.service';
import prisma from '@/shared/prisma/client';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(() => {
    service = new OrganizationService();
  });

  describe('getAccount()', () => {
    it('should return organization account with negated balance', async () => {
      // Arrange
      const expectedId = 'org-main-account';

      // Act
      const result = await service.getAccount();

      // Assert
      expect(result).toBeDefined();
      expect(result.entity_id).toBe(expectedId);
    });

    it('should auto-create account if not exists', async () => {
      // Arrange - ensure account doesn't exist
      await prisma.account.deleteMany({ where: { entity_id: 'org-main-account' } });

      // Act
      const result = await service.getAccount();

      // Assert
      expect(result).toBeDefined();
      expect(result.balance.toString()).toBe('0');
    });
  });

  describe('getStats()', () => {
    it('should calculate stats for given year and month', async () => {
      // Arrange
      const year = 2025;
      const month = 3;

      // Act
      const stats = await service.getStats({ year, month });

      // Assert
      expect(stats).toBeDefined();
      expect(stats.commission_income).toBeDefined();
      expect(stats.expenses).toBeDefined();
    });
  });
});
```

**Patterns:**

1. **Arrange-Act-Assert (AAA):**
   - Arrange: Set up test data
   - Act: Call the function being tested
   - Assert: Verify the result

2. **Describe/It Nesting:**
   - Group related tests with `describe()`
   - Keep it at 2-3 levels deep maximum
   - Inner `describe` for method names, outer for class names

3. **Setup/Teardown:**
   - `beforeEach()`: Reset state before each test
   - `afterEach()`: Clean up test data
   - `beforeAll()`: Expensive setup (e.g., database connection)
   - `afterAll()`: Cleanup after all tests

## Mocking

**Framework:** Vitest has built-in mocking with `vi.mock()`

**Patterns (Recommended):**
```typescript
// Mock Prisma for unit tests (don't need real database)
vi.mock('@/shared/prisma/client', () => ({
  default: {
    transaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock external service
vi.mock('@/modules/commission/commission.service', () => ({
  commissionService: {
    calculateDepositCommission: vi.fn(),
    createSnapshot: vi.fn(),
  },
}));

// Use mock in test
import { commissionService } from '@/modules/commission/commission.service';

it('should use commission service', async () => {
  // Arrange
  vi.mocked(commissionService.calculateDepositCommission).mockResolvedValue({
    site_commission_amount: new Decimal('60'),
    partner_commission_amount: new Decimal('15'),
    financier_commission_amount: new Decimal('25'),
    organization_amount: new Decimal('20'),
  });

  // Act
  const result = await service.processDeposit(input, userId);

  // Assert
  expect(commissionService.calculateDepositCommission).toHaveBeenCalledWith(
    input.site_id,
    input.financier_id,
    expect.any(Decimal)
  );
});
```

**What to Mock:**
- ✅ Prisma database client (for unit tests)
- ✅ External services (commission, notification, approval)
- ✅ HTTP clients (fetch calls)
- ✅ Random/time-dependent functions (use `vi.useFakeTimers()`)

**What NOT to Mock:**
- ❌ Business logic you're testing
- ❌ Zod schemas (test validation separately)
- ❌ Decimal.js (test with real decimals)
- ❌ Error classes (use real instances)
- ❌ Middleware/utilities (test actual behavior)

## Fixtures and Factories

**Test Data (Recommended Pattern):**
```typescript
// test-data.ts or fixtures.ts
import { Decimal } from 'decimal.js';
import { TransactionType, EntityType } from '@prisma/client';

export const fixtures = {
  site: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Site',
    code: 'TEST_SITE',
    is_active: true,
  },

  transaction: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    type: TransactionType.DEPOSIT,
    gross_amount: new Decimal('1000'),
    net_amount: new Decimal('940'),
    site_id: fixtures.site.id,
  },

  commission: {
    site_commission_amount: new Decimal('60'),
    partner_commission_amount: new Decimal('15'),
    financier_commission_amount: new Decimal('25'),
    organization_amount: new Decimal('20'),
  },
};

// Factory for dynamic test data
export function createTestTransaction(overrides = {}) {
  return {
    ...fixtures.transaction,
    ...overrides,
  };
}

export function createTestSite(overrides = {}) {
  return {
    ...fixtures.site,
    ...overrides,
  };
}
```

**Usage in Tests:**
```typescript
import { fixtures, createTestTransaction } from './test-data';

it('should process deposit', async () => {
  const input = {
    ...fixtures.transaction,
    amount: '1000',
  };

  const result = await service.processDeposit(input, userId);
  expect(result.id).toBeDefined();
});

it('should handle different amounts', async () => {
  const amounts = [100, 500, 1000, 5000];

  for (const amount of amounts) {
    const input = createTestTransaction({ gross_amount: new Decimal(amount) });
    const result = await service.processDeposit(input, userId);
    expect(result).toBeDefined();
  }
});
```

**Location:**
- `apps/backend/__tests__/fixtures/` or
- `apps/backend/test-data.ts` at root
- Keep alongside integration test files

## Coverage

**Requirements:**
- Not enforced currently (no coverage config)
- Recommended targets:
  - Services: 80%+ coverage
  - Controllers: 70%+ coverage (integration-heavy)
  - Utils: 90%+ coverage
  - Business-critical code (ledger, commission): 100%

**View Coverage:**
```bash
npm run test:coverage
# Generates coverage/index.html (open in browser)
```

## Test Types

**Unit Tests (Core Pattern):**
- Test individual functions/methods in isolation
- Mock all external dependencies (Prisma, services)
- Fast execution (< 100ms per test)
- Example: Test `formatMoney()` with various inputs
```typescript
describe('formatMoney()', () => {
  it('should format decimal to Turkish currency', () => {
    const result = formatMoney(new Decimal('1234.56'));
    expect(result).toBe('1.234,56 ₺');
  });

  it('should handle zero', () => {
    expect(formatMoney(new Decimal('0'))).toBe('0,00 ₺');
  });
});
```

**Integration Tests (Recommended):**
- Test multiple components together with real/test database
- Use test database (PostgreSQL running locally)
- Reset database before each test via `beforeEach()`
- Slower but catches real bugs
```typescript
describe('Transaction Processing Integration', () => {
  beforeEach(async () => {
    // Reset test database
    await prisma.$executeRawUnsafe('DELETE FROM ledger_entry');
    await prisma.$executeRawUnsafe('DELETE FROM transaction');
    await prisma.$executeRawUnsafe('DELETE FROM account');
  });

  it('should create balanced ledger entries', async () => {
    const input = createTestDeposit();

    const result = await service.processDeposit(input, userId);

    const entries = await prisma.ledgerEntry.findMany({
      where: { transaction_id: result.id },
    });

    const debitSum = entries
      .filter(e => e.entry_type === 'DEBIT')
      .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

    const creditSum = entries
      .filter(e => e.entry_type === 'CREDIT')
      .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

    expect(debitSum).toEqual(creditSum);
  });
});
```

**E2E Tests:**
- NOT currently implemented
- Would test full user workflows (login → create transaction → view report)
- Requires test frontend runner (Playwright, Cypress, or Selenium)
- Recommended for critical paths:
  - User authentication
  - Deposit transaction workflow
  - Commission calculation verification
  - Report generation

## Common Patterns

**Async Testing:**
```typescript
// Pattern 1: Using async/await
it('should fetch data', async () => {
  const result = await service.getAccount();
  expect(result).toBeDefined();
});

// Pattern 2: Returning promise (old style, not recommended)
it('should fetch data', () => {
  return service.getAccount().then(result => {
    expect(result).toBeDefined();
  });
});

// Pattern 3: Using done callback (deprecated)
// Don't use - stick with async/await
```

**Error Testing:**
```typescript
// Test that error is thrown
it('should throw NotFoundError for missing site', async () => {
  const input = createTestDeposit({ site_id: 'nonexistent' });

  await expect(
    service.processDeposit(input, userId)
  ).rejects.toThrow(NotFoundError);
});

// Test error properties
it('should include correct error details', async () => {
  try {
    await service.processDeposit(invalidInput, userId);
    fail('Should have thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(BusinessError);
    expect(error.code).toBe('INSUFFICIENT_BALANCE');
    expect(error.statusCode).toBe(400);
  }
});

// Test validation errors
it('should validate amount is positive', async () => {
  const schema = createDepositSchema;
  const result = schema.safeParse({ ...invalidInput, amount: '-100' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.errors[0].code).toBe('custom');
  }
});
```

**Decimal Precision Testing (CRITICAL):**
```typescript
describe('Decimal precision', () => {
  it('should maintain precision in calculations', () => {
    const amount = new Decimal('1000.00');
    const siteRate = new Decimal('0.06');
    const commission = amount.times(siteRate);

    expect(commission.toString()).toBe('60');
  });

  it('should handle running balance correctly', () => {
    let balance = new Decimal('100.00');
    const deposit = new Decimal('500.00');
    const withdrawal = new Decimal('150.00');

    balance = balance.plus(deposit).minus(withdrawal);
    expect(balance.toFixed(2)).toBe('450.00');
  });

  it('should ensure ledger balance (DEBIT = CREDIT)', () => {
    const entries = [
      { type: 'DEBIT', amount: new Decimal('1000') },
      { type: 'CREDIT', amount: new Decimal('600') },
      { type: 'CREDIT', amount: new Decimal('400') },
    ];

    const debit = entries
      .filter(e => e.type === 'DEBIT')
      .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

    const credit = entries
      .filter(e => e.type === 'CREDIT')
      .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

    expect(debit.eq(credit)).toBe(true);
  });
});
```

**Mocking Decimal.js:**
```typescript
// Don't mock Decimal - use real instances
it('should calculate commission', async () => {
  const amount = new Decimal('1000'); // Real Decimal
  const rate = new Decimal('0.06');    // Real Decimal
  const commission = amount.times(rate);

  expect(commission.toString()).toBe('60');
});
```

## Current Testing State

**Status:**
- ✅ Vitest configured (1.4.0)
- ✅ TypeScript strict mode
- ❌ No test files written yet
- ❌ No test coverage
- ❌ No E2E tests

**Next Steps for Implementation:**
1. Create `__tests__/` directory structure
2. Write unit tests for utilities (`decimal.ts`, `errors.ts`)
3. Write integration tests for core services (`transaction.service`, `organization.service`)
4. Aim for 80%+ coverage on critical financial logic
5. Set up CI/CD to run tests on every PR
6. Consider E2E tests for user workflows (optional)

## Test Database Configuration

**Connection Details:**
```
Host: localhost:5432
Database: finanspro_v3
User: finanspro_v3
Password: finanspro_v3_secure_password (from .env)
```

**Reset for Testing:**
```bash
# Full reset (requires --force-reset flag in testing)
npx prisma db push --force-reset --accept-data-loss

# Seed with test data
node --import tsx prisma/seed.ts

# Via environment variable (optional)
DATABASE_URL="postgresql://finanspro_v3:finanspro_v3_secure_password@localhost:5432/finanspro_v3_test" npm run test
```

**Test Database Strategy:**
- Option 1: Use same database, reset before/after tests
- Option 2: Create separate `finanspro_v3_test` database
- Option 3: Use Docker with ephemeral container per test run (best for CI/CD)

---

*Testing analysis: 2026-02-28*
