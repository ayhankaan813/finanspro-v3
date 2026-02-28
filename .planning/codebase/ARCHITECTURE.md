# Architecture

**Analysis Date:** 2026-02-28

## Pattern Overview

**Overall:** Monorepo-based Modular Service Architecture with Domain-Driven Design (DDD)

**Key Characteristics:**
- pnpm workspaces monorepo with two main applications (backend, frontend)
- Module-per-domain structure in backend (Transaction, Site, Partner, etc.)
- Clear separation of concerns: routes → services → data layer
- Double-entry ledger system for financial accuracy
- Event-driven approval workflow with async processing
- React Query-based state management with Zustand for auth

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface and client-side state management
- Location: `apps/frontend/src/app/`, `apps/frontend/src/components/`
- Contains: Next.js 15 pages (App Router), React components, forms, charts
- Depends on: React Query hooks, API client, Zustand stores
- Used by: End users (via browser)

**API Layer (Backend Routes):**
- Purpose: HTTP endpoint handling and request validation
- Location: `apps/backend/src/modules/*/[module].routes.ts`
- Contains: Fastify route definitions, request/response handling, error serialization
- Depends on: Service layer, Auth middleware, Zod schemas
- Used by: Frontend, external integrations

**Business Logic Layer (Backend Services):**
- Purpose: Core domain logic, calculations, state transitions
- Location: `apps/backend/src/modules/*/[module].service.ts`
- Contains: Decimal.js calculations, commission processing, ledger entries, statistics
- Depends on: Data layer (Prisma), utility functions, other services
- Used by: Route handlers

**Data Access Layer:**
- Purpose: Database operations and ORM abstraction
- Location: `apps/backend/src/shared/prisma/client.ts`, Prisma schema
- Contains: Prisma client, database models, migrations
- Depends on: PostgreSQL database
- Used by: All services

**Cross-Cutting Layers:**
- **Auth & Security:** `apps/backend/src/modules/auth/` - JWT validation, role-based access
- **Error Handling:** `apps/backend/src/shared/middleware/error-handler.ts` - Unified error responses
- **Logging:** `apps/backend/src/shared/utils/logger.ts` - Pino-based structured logging
- **Configuration:** `apps/backend/src/config/env.ts` - Environment validation with Zod

## Data Flow

**Transaction Processing Flow:**

1. **Creation** → Frontend form submits to `POST /api/transactions/{type}`
2. **Validation** → Route handler parses request with Zod schema
3. **Business Logic** → Service applies domain rules:
   - Calculate commissions using `CommissionRate` table
   - Determine if approval required (by user role)
   - Create transaction record with PENDING or COMPLETED status
4. **Ledger Posting** → If approved or auto-approved:
   - `ledgerService.createEntries()` creates DEBIT/CREDIT pairs
   - Each account balance updated atomically
   - Commission snapshot created for accounting reconciliation
5. **Notification** → Async notification service posts events
6. **Response** → Client receives transaction ID, can poll for status changes

**State Management:**

- **Backend:** Prisma transactions ensure ACID compliance
  - Nested transactions used for multi-step operations
  - Pessimistic locking on financier blocks to prevent race conditions
  - Soft deletes preserve audit trail

- **Frontend:** React Query handles server state
  - `use-api.ts` provides typed hooks for all endpoints
  - `invalidateQueries()` triggers refetch on mutations
  - Zustand store manages auth token and user session
  - Local state for UI (modals, forms) in components

## Key Abstractions

**Transaction Entity:**
- Purpose: Represents financial movement between entities
- Examples: `apps/backend/src/modules/transaction/transaction.service.ts`, schema
- Pattern: Type-based (DEPOSIT, WITHDRAWAL, SITE_DELIVERY, etc.) polymorphic entity
- Stateful: PENDING → COMPLETED, with optional reversal

**Ledger Entry:**
- Purpose: Double-entry bookkeeping record (DEBIT or CREDIT)
- Examples: `apps/backend/src/modules/ledger/ledger.service.ts`
- Pattern: Always created in balanced pairs (DEBIT amount = CREDIT amount)
- Invariant: Sum(DEBIT) must equal Sum(CREDIT) across all entries

**Commission Calculation:**
- Purpose: Distribute transaction amount across stakeholders
- Examples: `apps/backend/src/modules/transaction/commission.service.ts`
- Pattern: Lookup-based using `CommissionRate` table + transaction type
- Precision: Uses Decimal.js to prevent floating-point errors

**Account (Balance):**
- Purpose: Track balance for Site, Partner, Financier, Organization, ExternalParty
- Examples: Schema model, ledger service
- Pattern: Balance = SUM(DEBIT entries) - SUM(CREDIT entries) per account
- Special case: Organization negated for display (stored as expenses - income)

**Approval Workflow:**
- Purpose: Route transactions based on user role and type
- Examples: `apps/backend/src/modules/approval/approval.service.ts`
- Pattern: Admin auto-approves, others create PENDING awaiting admin review
- Transition: PENDING → COMPLETED → ledger posting triggers

## Entry Points

**Backend Server:**
- Location: `apps/backend/src/main.ts`
- Triggers: `npm run dev` or node process start
- Responsibilities:
  - Database connection validation
  - Fastify app initialization with plugins (compression, CORS, JWT, rate limit)
  - Middleware registration (auth, error handling)
  - Route registration from all modules
  - Graceful shutdown on SIGINT/SIGTERM

**Frontend Application:**
- Location: `apps/frontend/src/app/layout.tsx` → `page.tsx`
- Triggers: Browser navigation or direct URL access
- Responsibilities:
  - HTML skeleton and font setup
  - Provider initialization (React Query, Auth store)
  - Route matching via Next.js App Router
  - Conditional rendering: login vs. dashboard based on auth token

**Routes (Backend):**
- Location: `apps/backend/src/modules/*/[module].routes.ts`
- Pattern: Each module exports async function `[module]Routes(app: FastifyInstance)`
- Called from: `apps/backend/src/app.ts` during startup
- All routes behind JWT authentication via preHandler hook

## Error Handling

**Strategy:** Unified error responses with typed error codes

**Patterns:**

- **AppError:** Base class with code and message
  - `NotFoundError` - 404 when resource missing
  - `ValidationError` - 400 with field-level details from Zod
  - `BusinessError` - 400 for business rule violations
  - `InsufficientBalanceError` - 400 when balance check fails

- **Route Handler:** All errors caught by global error handler
  - Zod errors → 400 with field details
  - AppError instances → appropriate status + code
  - Unknown errors → 500 with sanitized message (no details in prod)
  - All errors logged with request context

- **Response Format:**
  ```typescript
  Success: { success: true, data: {...} }
  Error: { success: false, error: { code: "NOT_FOUND", message: "...", details?: {} } }
  ```

## Cross-Cutting Concerns

**Logging:** Pino logger in `apps/backend/src/shared/utils/logger.ts`
- Structured JSON logs
- Log levels: fatal, error, warn, info, debug, trace
- Request context included in errors (method, URL, params, query)

**Validation:** Zod schemas for all inputs
- Location: `apps/backend/src/modules/*/[module].schema.ts`
- Applied at route handler: `schema.parse(request.body)`
- Prevents invalid data from reaching services
- Type-safe with inferred TypeScript types

**Authentication:** JWT-based with refresh tokens
- Issued at login, stored in localStorage on frontend
- Verified via `@fastify/jwt` and `authenticate` hook on routes
- Expires per JWT_ACCESS_EXPIRES_IN (default 4h)
- Refresh token mechanism for extended sessions

**Decimal Precision:** Decimal.js for all financial calculations
- Never use JavaScript `number` type for money
- Methods: `.plus()`, `.minus()`, `.times()`, `.dividedBy()`
- Database precision: DECIMAL(15, 2)
- All balance calculations verified in tests

---

*Architecture analysis: 2026-02-28*
