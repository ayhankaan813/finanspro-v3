# Codebase Structure

**Analysis Date:** 2026-02-28

## Directory Layout

```
finanspro-v3/
├── apps/
│   ├── backend/                    # Fastify API server
│   │   ├── src/
│   │   │   ├── main.ts            # Entry point: starts server
│   │   │   ├── app.ts             # Fastify setup, plugin registration
│   │   │   ├── config/
│   │   │   │   ├── env.ts         # Environment validation
│   │   │   │   └── index.ts
│   │   │   ├── modules/           # Domain-based organization
│   │   │   │   ├── auth/          # Authentication & JWT
│   │   │   │   ├── site/          # Casino site management
│   │   │   │   ├── partner/       # Partner (komisyoncu) management
│   │   │   │   ├── financier/     # Financier management
│   │   │   │   ├── external-party/# External party management
│   │   │   │   ├── transaction/   # Transaction processing & commission
│   │   │   │   ├── ledger/        # Double-entry bookkeeping
│   │   │   │   ├── organization/  # Organization account & analytics
│   │   │   │   ├── approval/      # Approval workflow
│   │   │   │   ├── balance/       # Balance calculation utilities
│   │   │   │   ├── notification/  # Event notifications
│   │   │   │   ├── settings/      # Commission rates & configuration
│   │   │   │   ├── personnel/     # Personnel management
│   │   │   │   ├── report/        # Report generation
│   │   │   └── shared/
│   │   │       ├── middleware/
│   │   │       │   └── error-handler.ts
│   │   │       ├── prisma/
│   │   │       │   └── client.ts
│   │   │       └── utils/
│   │   │           ├── decimal.ts
│   │   │           ├── errors.ts
│   │   │           └── logger.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database models & relations
│   │   │   └── seed.ts            # Test data generator
│   │   ├── dist/                  # Compiled JavaScript
│   │   └── package.json
│   │
│   └── frontend/                   # Next.js 15 application
│       ├── src/
│       │   ├── app/               # Next.js App Router pages
│       │   │   ├── (auth)/        # Login route group
│       │   │   │   └── login/
│       │   │   ├── (dashboard)/   # Protected routes
│       │   │   │   ├── dashboard/
│       │   │   │   ├── sites/[id]/
│       │   │   │   ├── partners/[id]/
│       │   │   │   ├── financiers/[id]/
│       │   │   │   ├── external-parties/[id]/
│       │   │   │   ├── transactions/
│       │   │   │   ├── approvals/
│       │   │   │   ├── reports/   # Cash, reconciliation, analysis reports
│       │   │   │   ├── organization/
│       │   │   │   └── settings/
│       │   │   ├── layout.tsx     # Root layout
│       │   │   └── page.tsx       # Home (redirects to login or dashboard)
│       │   ├── components/
│       │   │   ├── layout/        # Layout components (header, sidebar)
│       │   │   ├── dashboard/     # Dashboard-specific components
│       │   │   ├── transactions/  # Transaction forms & tables
│       │   │   ├── bulk-import/   # Bulk import utilities
│       │   │   └── ui/            # shadcn/ui components
│       │   ├── hooks/
│       │   │   ├── use-api.ts     # React Query hooks for all endpoints
│       │   │   ├── use-layout-api.ts
│       │   │   └── use-toast.ts
│       │   ├── lib/
│       │   │   ├── api.ts         # HTTP client class
│       │   │   └── utils.ts       # Utility functions
│       │   ├── stores/
│       │   │   └── auth.store.ts  # Zustand auth store (token, user)
│       │   ├── styles/
│       │   │   └── globals.css    # Tailwind base styles
│       │   └── features/          # Feature-specific logic
│       ├── public/                # Static assets
│       ├── .next/                 # Build output
│       └── package.json
│
├── packages/
│   └── shared/                    # Shared types & constants (if used)
│
├── .claude/                       # Claude Code customizations
│   ├── commands/                  # Custom slash commands
│   └── CLAUDE.md                  # Project instructions
│
├── .planning/
│   └── codebase/                  # GSD codebase analysis
│
├── .git/                          # Version control
├── .gitignore
├── package.json                   # Workspace root
├── turbo.json                     # Turbo build configuration
└── tsconfig.json                  # Root TypeScript config
```

## Directory Purposes

**`apps/backend/src/main.ts`:**
- Purpose: Application entry point
- Initializes database connection, Fastify app, registers routes, starts server
- Handles graceful shutdown on SIGINT/SIGTERM

**`apps/backend/src/app.ts`:**
- Purpose: Fastify app factory and plugin configuration
- Registers: compression, CORS, helmet, JWT, rate limiting, Swagger (dev only)
- Imports and registers all module routes
- Sets global error handler

**`apps/backend/src/config/env.ts`:**
- Purpose: Environment variable parsing and validation
- Uses Zod to validate: DATABASE_URL, PORT, JWT_SECRET, etc.
- Exports: `env` object (typed), `isDev`, `isProd`, `isTest` helpers
- Fails fast on startup if validation fails

**`apps/backend/src/modules/[module]/`:**
- Purpose: Domain-organized modules (auth, site, partner, transaction, etc.)
- Pattern: Each module exports routes and services
- Structure per module:
  - `[module].routes.ts` - Fastify route definitions
  - `[module].service.ts` - Business logic
  - `[module].schema.ts` - Zod validation schemas
  - `index.ts` - Barrel export

**`apps/backend/src/modules/transaction/`:**
- Purpose: Core transaction processing and commission distribution
- Files:
  - `transaction.service.ts` - Process DEPOSIT, WITHDRAWAL, SITE_DELIVERY, etc.
  - `transaction.routes.ts` - Transaction endpoints
  - `transaction.schema.ts` - Input validation schemas
  - `commission.service.ts` - Commission calculation and snapshot creation

**`apps/backend/src/modules/ledger/`:**
- Purpose: Double-entry accounting ledger
- Files:
  - `ledger.service.ts` - Create DEBIT/CREDIT entries, balance verification
  - `ledger.routes.ts` - Query endpoints for ledger entries

**`apps/backend/src/shared/middleware/`:**
- Purpose: Cross-cutting middleware
- Files:
  - `error-handler.ts` - Global error handling, response formatting
  - `index.ts` - Barrel export

**`apps/backend/src/shared/utils/`:**
- Purpose: Reusable utility functions
- Files:
  - `decimal.ts` - Decimal.js helper functions
  - `errors.ts` - Error class definitions
  - `logger.ts` - Pino logger instance

**`apps/backend/prisma/schema.prisma`:**
- Purpose: Database schema definition
- Contains: 21+ models (User, Site, Partner, Transaction, LedgerEntry, etc.)
- Features: Indexes, soft deletes (`deleted_at`), relations, enums

**`apps/frontend/src/app/`:**
- Purpose: Next.js App Router file-based routing
- Layout groups:
  - `(auth)` - Login page (unauthenticated)
  - `(dashboard)` - Protected routes (requires JWT token)
- Segment-based file structure: `[id]/page.tsx` for dynamic routes

**`apps/frontend/src/components/`:**
- Purpose: Reusable React components
- Subdirectories:
  - `layout/` - Header, sidebar, navigation
  - `dashboard/` - Dashboard widgets, charts
  - `transactions/` - Forms, tables for transaction management
  - `ui/` - shadcn/ui primitive components (Button, Dialog, etc.)
  - `bulk-import/` - CSV import utilities

**`apps/frontend/src/hooks/use-api.ts`:**
- Purpose: React Query hooks for all API endpoints
- Size: ~2000 lines - largest frontend file
- Pattern: `useQuery()` for GET, `useMutation()` for POST/PUT/DELETE
- Exports: Typed hooks like `useSites()`, `useTransactions()`, `useOrganizationBalance()`

**`apps/frontend/src/lib/api.ts`:**
- Purpose: HTTP client implementation
- Features:
  - Automatic JWT token injection
  - Automatic token refresh on 401
  - Request parameter serialization
  - Error handling and response parsing

**`apps/frontend/src/stores/auth.store.ts`:**
- Purpose: Zustand store for authentication state
- Manages: JWT token, refresh token, user info, login/logout actions
- Persisted to: localStorage as `finanspro-auth`

## Key File Locations

**Entry Points:**
- `apps/backend/src/main.ts` - Backend server start
- `apps/backend/src/app.ts` - Fastify app factory
- `apps/frontend/src/app/layout.tsx` - Frontend root layout
- `apps/frontend/src/app/(dashboard)/dashboard/page.tsx` - Dashboard home

**Configuration:**
- `apps/backend/src/config/env.ts` - Environment variables
- `apps/backend/prisma/schema.prisma` - Database schema
- `turbo.json` - Monorepo build configuration
- `apps/frontend/tsconfig.json` - TypeScript paths for `@/`

**Core Logic:**
- `apps/backend/src/modules/transaction/transaction.service.ts` - Transaction processing (1000+ lines)
- `apps/backend/src/modules/transaction/commission.service.ts` - Commission calculation
- `apps/backend/src/modules/site/site.service.ts` - Site statistics
- `apps/backend/src/modules/organization/organization.service.ts` - Organization analytics

**Testing:**
- `apps/backend/src/modules/*/[module].service.ts` - Contains test-friendly exports
- `apps/backend/prisma/seed.ts` - Test data generation
- `apps/frontend/src/hooks/use-api.ts` - Test-friendly hook exports

## Naming Conventions

**Files:**
- `kebab-case.ts` for all TypeScript files
- `PascalCase.tsx` for React components only (e.g., `DashboardLayout.tsx`)
- Pattern: `[feature].[type].ts` (e.g., `site.service.ts`, `user.schema.ts`)

**Directories:**
- `kebab-case/` for all directories
- Feature-based: `site/`, `partner/`, `transaction/`
- Layer-based: `components/`, `hooks/`, `lib/`, `stores/`

**Functions:**
- `camelCase` for all functions: `calculateCommission()`, `findSiteById()`
- Service methods: `processDeposit()`, `getStats()`, `findAll()`
- React hooks: `useSites()`, `useTransaction()`, `useAuthStore()`

**Variables & Constants:**
- `camelCase` for variables: `siteId`, `grossAmount`
- `SCREAMING_SNAKE_CASE` for constants: `COMMISSION_RATES`, `API_BASE_URL`
- Database column names: `snake_case` (e.g., `site_id`, `created_at`)

**Types:**
- `PascalCase` for interfaces: `Site`, `Transaction`, `CommissionBreakdown`
- Suffix with `Input` for request types: `CreateSiteInput`, `UpdateTransactionInput`
- Suffix with `Output` for response types (if needed)

## Where to Add New Code

**New Feature (API endpoint + UI):**
- Backend:
  - Add route in: `apps/backend/src/modules/[domain]/[domain].routes.ts`
  - Add service method in: `apps/backend/src/modules/[domain]/[domain].service.ts`
  - Add validation schema in: `apps/backend/src/modules/[domain]/[domain].schema.ts`
- Frontend:
  - Add page in: `apps/frontend/src/app/(dashboard)/[feature]/page.tsx`
  - Add component in: `apps/frontend/src/components/[feature]/`
  - Add hook in: `apps/frontend/src/hooks/use-api.ts` (add new hook function)

**New Module (domain like "site", "partner"):**
- Create: `apps/backend/src/modules/[new-module]/`
- Inside:
  - `[new-module].routes.ts` - Route definitions
  - `[new-module].service.ts` - Business logic
  - `[new-module].schema.ts` - Validation
  - `index.ts` - Barrel export
- Register routes in: `apps/backend/src/app.ts` (import and register)

**New UI Component:**
- Atomic component: `apps/frontend/src/components/ui/[name].tsx`
- Feature component: `apps/frontend/src/components/[feature]/[name].tsx`
- Page component: `apps/frontend/src/app/(dashboard)/[feature]/page.tsx`

**Utility Function:**
- Shared backend: `apps/backend/src/shared/utils/[name].ts`
- Shared frontend: `apps/frontend/src/lib/[name].ts`

**Database Change:**
- Edit: `apps/backend/prisma/schema.prisma`
- Generate migration: `pnpm db:migrate`
- Push schema: `pnpm db:push`

## Special Directories

**`apps/backend/dist/`:**
- Purpose: Compiled JavaScript output
- Generated: Yes (via `tsc`)
- Committed: No (in .gitignore)
- Usage: Production deployment uses `node dist/main.js`

**`apps/frontend/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (via `next build`)
- Committed: No (in .gitignore)
- Usage: Production deployment uses `.next/` with standalone server

**`apps/backend/node_modules/`, `apps/frontend/node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (via `pnpm install`)
- Committed: No (in .gitignore)
- Workspace-managed: Via pnpm workspaces

**`apps/backend/prisma/migrations/`:**
- Purpose: Database migration files (if using prisma migrate)
- Generated: Yes (via `prisma migrate dev`)
- Committed: Yes (migration history)
- Not present in this repo (using `db push` instead)

---

*Structure analysis: 2026-02-28*
