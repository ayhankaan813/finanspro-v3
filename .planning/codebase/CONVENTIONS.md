# Coding Conventions

**Analysis Date:** 2026-02-28

## Naming Patterns

**Files:**
- Services: `snake-case` with `.service.ts` suffix → `organization.service.ts`, `transaction.service.ts`
- Controllers: `snake-case` with `.controller.ts` suffix → `organization.controller.ts`
- Routes: `snake-case` with `.routes.ts` suffix → `organization.routes.ts`
- Schemas/Validation: `snake-case` with `.schema.ts` suffix → `transaction.schema.ts`
- Utilities: `snake-case` with `.ts` suffix → `errors.ts`, `logger.ts`, `decimal.ts`
- React Components: `PascalCase` with `.tsx` suffix → `TransactionFilters.tsx`, `DashboardLayout.tsx`
- React Hooks: `kebab-case` with `use-` prefix → `use-api.ts`, `use-layout-api.ts`, `use-toast.ts`
- UI Components: `kebab-case` inside `components/ui/` → `alert-dialog.tsx`, `card.tsx`

**Functions:**
- camelCase for all functions → `calculateDepositCommission()`, `getOrganizationAccount()`, `formatMoney()`
- Service methods: always async where they interact with database → `async getStats()`
- Private methods/utilities: same camelCase convention → `getRefreshToken()`, `getAccount()`

**Variables:**
- camelCase for local variables and parameters → `selectedYear`, `isLoading`, `formatDate`
- Constants with underscores: `SCREAMING_SNAKE_CASE` → `ORG_ENTITY_ID`, `API_BASE_URL`, `INITIAL_FILTERS`
- Database column names: `snake_case` → `site_id`, `financier_id`, `transaction_date`, `created_at`
- Boolean variables: prefix with `is` or `has` → `isLoading`, `isActive`, `hasError`

**Types/Interfaces:**
- PascalCase for all interfaces and types → `OrgStatsQuery`, `LedgerEntryData`, `TransactionFiltersProps`
- Props interfaces: suffix with `Props` → `TransactionFiltersProps`, `NavItem`
- Response types: descriptive names without suffix → `ApiResponse<T>`, `ErrorResponse`
- Enums from Prisma: use as-is → `TransactionType.DEPOSIT`, `EntityType.SITE`

## Code Style

**Formatting:**
- Line length: No explicit limit enforced, but aim for readable ~100-120 characters
- Indentation: 2 spaces (configured in tsconfig.json, prettier defaults)
- Semicolons: Always included at end of statements
- Quotes: Double quotes for strings (`"`) in TypeScript/JavaScript, single quotes in JSDoc comments

**Linting:**
- ESLint configured with TypeScript support (`@typescript-eslint/eslint-plugin`)
- No ESLint config file present (using defaults)
- Backend packages: eslint 8.57.0, @typescript-eslint/parser 7.4.0
- Frontend packages: eslint 8.57.0, eslint-config-next 15.0.8
- Run: `npm run lint` in respective workspace
- Unused imports may be silently permitted (no strict unused variable rule observed)

**TypeScript Compiler:**
- Backend (`apps/backend/tsconfig.json`): strict mode enabled, ES2022 target, NodeNext module resolution
- Frontend (`apps/frontend/tsconfig.json`): strict mode enabled, ES2017 target, bundler module resolution
- Both: sourceMap and declaration generation enabled for debugging

## Import Organization

**Order:**
1. External packages from node_modules → `import { Decimal } from 'decimal.js'`
2. Prisma types → `import { TransactionType, EntityType } from '@prisma/client'`
3. Fastify/React packages → `import { FastifyRequest, FastifyReply } from 'fastify'`
4. Relative imports from shared → `import prisma from '../../shared/prisma/client.js'`
5. Relative imports from modules → `import { commissionService } from '../commission/commission.service.js'`
6. Local relative imports → `import { NotFoundError } from './errors.js'`

Example from `organization.service.ts`:
```typescript
import { Prisma, TransactionType, EntityType, LedgerEntryType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
```

**Path Aliases:**
- Backend: `@/*` → `src/*`, `@shared/*` → `../../packages/shared/src/*`
- Frontend: `@/*` → `src/*`, `@shared/*` → `../../packages/shared/src/*`
- Use aliases for cross-directory imports (cleaner than relative paths)

## Error Handling

**Patterns:**
- Custom error classes extend `AppError` base class → `BusinessError`, `ValidationError`, `AuthenticationError`
- All custom errors include: `statusCode`, `code` (machine-readable), `message` (user-facing)
- Domain-specific errors: `NotFoundError`, `InsufficientBalanceError`, `LedgerImbalanceError`, `ApprovalRequiredError`
- Zod validation errors caught in error handler middleware → automatically formatted as `VALIDATION_ERROR` with field details
- Fastify error handler normalizes all error types to consistent `ErrorResponse` format

**Usage Pattern:**
```typescript
// Throw specific errors with context
if (!site) throw new NotFoundError('Site', input.site_id);
if (amount.lessThan(required)) throw new InsufficientBalanceError(available, required);
if (!totalDebit.eq(totalCredit)) throw new LedgerImbalanceError(totalDebit.toString(), totalCredit.toString());

// Never expose stack traces to clients (handled in error-handler.ts)
```

**Response Format:**
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: VALIDATION_ERROR, NOT_FOUND, LEDGER_IMBALANCE
    message: string;        // User-friendly message
    details?: Record<string, unknown>;  // Optional: field errors for validation
  };
}
```

## Logging

**Framework:** Pino (production-grade logger with structured logging)

**Configuration:**
- Logger instance: `logger` from `@/shared/utils/logger.ts`
- Development: pino-pretty with colorization, timestamps, filtered PID/hostname
- Production: plain JSON output (parsed by log aggregation services)
- Log level: configurable via `LOG_LEVEL` environment variable

**Patterns:**
```typescript
// Error logging with context
logger.error({
  err: error,
  request: { method, url, params, query },
}, 'Error message');

// Info logging for operations
logger.info({ transactionId, amount, status }, 'Transaction created');

// Warn for unusual but recoverable situations
logger.warn({ balance, required }, 'Insufficient balance warning');
```

**When to Log:**
- Errors: Always log errors with full context (stack trace, request info)
- Critical operations: Log transaction creation, approval, reversal
- Data validation failures: Log with field names and values (no secrets)
- System events: Database migrations, service startup/shutdown
- Do NOT log: Passwords, tokens, sensitive PII, raw request bodies with secrets

## Comments

**When to Comment:**
- Complex business logic (e.g., running balance calculations, commission distribution)
- Accounting rules requiring explanation (e.g., why DEBIT vs CREDIT for account type)
- Non-obvious algorithm choices (e.g., why backward calculation instead of forward)
- Warnings about interdependencies or side effects
- Do NOT comment: Obvious code (`const name = user.name;`), self-documenting function names

**JSDoc/TSDoc:**
- Used for public service methods and complex functions
- Include `@param`, `@returns`, and context notes
- Example from `organization.service.ts`:

```typescript
/**
 * Get organization statistics (Income, Expense, Profit)
 */
async getStats(query: OrgStatsQuery) { ... }

/**
 * Get organization account details and balance
 *
 * NOTE: Organization is an ASSET account in the ledger (balance = DEBIT - CREDIT).
 * However, org income is recorded as CREDIT (from deposit commissions, ORG_INCOME, etc.)
 * We negate the balance for display so positive = net income (what business users expect).
 */
async getAccount() { ... }
```

**Comment Style:**
- Block comments for sections: `/* ... */`
- Line comments for single statements: `// ...`
- Turkish labels OK in UI (form labels), English in code comments and logic

## Function Design

**Size:**
- Aim for 30-50 lines per function (limit complexity)
- Larger functions OK if single responsibility (e.g., complex query logic, transaction processing)
- Services may be longer due to business logic density

**Parameters:**
- Use typed objects instead of positional parameters → `async processDeposit(input: CreateDepositInput, createdBy: string)`
- Separate schema definitions using Zod for validation inputs
- Keep parameters < 4; use input objects for more

**Return Values:**
- Always return typed responses → `Promise<OrganizationAccount>`, `LedgerResult`
- Never return `any` or untyped objects
- Consistent success format: `{ success: true, data: T }` for HTTP responses
- Errors thrown as exceptions (not returned)

**Async Patterns:**
- Database operations always async → all prisma calls wrapped in async
- Use `Promise.all()` for parallelizable operations → `await Promise.all([query1, query2, query3])`
- Use `prisma.$transaction()` for multi-step operations requiring atomicity

## Module Design

**Exports:**
- Each module has `index.ts` that re-exports public API
- Example from `organization/index.ts`: exports `organizationRoutes`, `organizationService`, `organizationController`
- Service instances typically singleton: `export const organizationService = new OrganizationService()`

**Barrel Files:**
- Used at module level (`index.ts`) to hide internal structure
- Allow `import { organizationService } from '@/modules/organization'` instead of full paths
- Keep imports clean: only re-export what's needed externally

**Directory Structure Per Module:**
```
modules/{name}/
├── {name}.service.ts        # Business logic
├── {name}.controller.ts     # Request handlers
├── {name}.routes.ts         # Route definitions
├── {name}.schema.ts         # Zod validation schemas (if needed)
└── index.ts                 # Public exports
```

## React/Frontend Patterns

**Component Structure:**
- Functional components with hooks (no classes)
- `"use client"` directive at top of file if using client-side hooks or state
- Props passed as single typed parameter with interface
- Example from `sidebar.tsx`:

```typescript
"use client";

import { useState, useMemo, memo, useCallback } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export default function Sidebar({ ... }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

**Hooks Usage:**
- React Query hooks from `@tanstack/react-query` prefixed with `use` → `useQuery`, `useMutation`
- Custom API hooks in `use-api.ts` follow pattern: `useEntityData()` → `useSiteStats()`, `useOrganizationAccount()`
- Zustand store for global auth state → `useAuthStore()` from `stores/auth.store.ts`

**Styling:**
- Tailwind CSS 3.4.1 with utility-first approach
- shadcn/ui components in `components/ui/` (Radix UI primitives styled with Tailwind)
- Color variables from deep space palette defined in component files (hardcoded hex values)
- Example color palette from `organization/page.tsx`:

```typescript
const COLORS = [
  "#0EA5E9", // Sky Blue
  "#38BDF8", // Light Sky
  "#0284C7", // Dark Sky
];
```

**Data Fetching:**
- React Query v5.28.0 for server state management
- API client in `lib/api.ts` handles token refresh, error handling
- Cache invalidation pattern: `queryClient.invalidateQueries()`
- Types defined in `hooks/use-api.ts` interfaces → `Site`, `Partner`, `Financier`, `Transaction`

## Database & Prisma

**Schema Naming:**
- Database columns: `snake_case` → `site_id`, `created_at`, `updated_at`, `deleted_at`
- Timestamps: Always include `created_at`, `updated_at`, soft delete with `deleted_at`
- UUIDs for primary keys and foreign keys
- Relations: defined with `@relation()` attributes

**Decimal Precision:**
- Financial amounts: `Decimal` Prisma type → `Decimal(15,2)` for 15 digits, 2 decimal places
- Always use Decimal.js methods, never JavaScript arithmetic
- Convert to Decimal immediately on input: `new Decimal(input.amount)`

**Validation:**
- Input validation: Zod schemas in `*.schema.ts` files
- Schema example from `transaction.schema.ts`:

```typescript
export const createDepositSchema = z.object({
  site_id: z.string().uuid('Geçersiz site ID'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Tutar pozitif bir sayı olmalı',
  }),
  description: z.string().max(500).optional(),
});
```

- Zod errors automatically caught by error handler → formatted as `VALIDATION_ERROR`

## Financial Precision Rules (CRITICAL)

**Decimal.js Methods - ONLY THESE ARE ALLOWED:**
- ✅ `.plus()` → Addition
- ✅ `.minus()` → Subtraction
- ✅ `.times()` → Multiplication
- ✅ `.dividedBy()` → Division
- ✅ `.toNumber()` → Only for display/output
- ✅ `.toDecimalPlaces(2)` → Ensure consistent precision
- ❌ `.add()` → WRONG - doesn't exist
- ❌ `.sub()` → WRONG - doesn't exist
- ❌ `.mul()` → WRONG - doesn't exist
- ❌ `.div()` → WRONG - doesn't exist

**Precision Configuration:**
From `shared/utils/decimal.ts`:
```typescript
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 9,
});
```

**Ledger Balance Rule:**
```
TOTAL DEBIT = TOTAL CREDIT (ALWAYS)
```
If unbalanced, throw `LedgerImbalanceError` immediately.

## API Response Format

**Success Response:**
```typescript
{
  success: true,
  data: { /* response object */ }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",        // Machine-readable
    message: "User message",   // Human-readable
    details?: { /* optional */ }  // Field-level errors for validation
  }
}
```

**HTTP Status Codes:**
- 200 OK: Successful GET/POST
- 400 Bad Request: Validation error, business rule violation
- 401 Unauthorized: Authentication required or failed
- 403 Forbidden: Authenticated but insufficient permissions
- 404 Not Found: Resource doesn't exist
- 409 Conflict: Data conflict (e.g., duplicate)
- 500 Internal Server Error: Unexpected errors (never expose stack trace)

---

*Convention analysis: 2026-02-28*
