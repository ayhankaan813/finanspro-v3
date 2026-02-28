---
phase: 05-data-foundation-and-api
plan: "02"
subsystem: backend-api
tags: [debt, fastify, prisma, decimal-js, zod, rest-api]
dependency_graph:
  requires: [05-01]
  provides: [06-01, 06-02]
  affects: [apps/backend/src/app.ts]
tech_stack:
  added: []
  patterns: [service-singleton, route-delegate, barrel-index, atomic-transaction, zod-validation]
key_files:
  created:
    - apps/backend/src/modules/debt/debt.schema.ts
    - apps/backend/src/modules/debt/debt.service.ts
    - apps/backend/src/modules/debt/debt.routes.ts
    - apps/backend/src/modules/debt/index.ts
  modified:
    - apps/backend/src/app.ts
decisions:
  - "Analytics routes (summary, financier-summary, matrix) defined before /:id to prevent Fastify from matching 'summary' as a path parameter"
  - "Decimal.js Prisma value conversion uses .toString() before wrapping in new Decimal() to handle Prisma Decimal objects correctly"
  - "prisma.$transaction used for atomic payment creation + debt update to prevent partial state"
metrics:
  duration: "~3 min"
  completed: "2026-03-01"
  tasks_completed: 5
  files_created: 4
  files_modified: 1
---

# Phase 5 Plan 02: Debt Backend Module Summary

**One-liner:** Full REST API for inter-financier debt management using DebtService class with Zod validation, Prisma atomic transactions, and Decimal.js precision.

## What Was Built

Complete `apps/backend/src/modules/debt/` module with 4 files, registered in `app.ts` under `/api/debts`. The API surface covers all four Phase 5 requirements (DEBT-01 through DEBT-04).

### Endpoints Created

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/debts/summary | Aggregate totals: active debt, paid amount, counts |
| GET | /api/debts/financier-summary | Per-financier alacak/borc breakdown + net_position |
| GET | /api/debts/matrix | Cross-table of debts between all active financiers |
| GET | /api/debts | Paginated list with status/financier_id filters |
| GET | /api/debts/:id | Single debt with full payments array |
| POST | /api/debts | Create debt (DEBT-01) |
| POST | /api/debts/:id/payments | Make payment, auto-PAID transition (DEBT-02) |
| PATCH | /api/debts/:id/cancel | Cancel debt with zero payments (DEBT-03) |

### Service Methods

| Method | Requirement | Key Logic |
|--------|-------------|-----------|
| create() | DEBT-01 | Same-financier guard, active-status check, initial remaining=amount |
| pay() | DEBT-02 | Payment <= remaining validation, prisma.$transaction, auto PAID at zero |
| cancel() | DEBT-03 | Zero-payments guard, sets cancelled_at + cancellation_reason |
| findById() | - | Single debt with payments ordered desc |
| findAll() | - | Paginated with OR filter for financier_id |
| getSummary() | - | Aggregate from active debts using Decimal.js loops |
| getFinancierSummary() | - | Per-financier net_position calculation |
| getMatrix() | - | Bi-dimensional lender/borrower Map aggregation |

## Validation Rules Enforced

- lender_id != borrower_id (SAME_FINANCIER error)
- Both financiers must exist and be active (LENDER_INACTIVE / BORROWER_INACTIVE)
- Payment amount must not exceed remaining_amount (PAYMENT_EXCEEDS_REMAINING)
- Cancellation only allowed on ACTIVE debts with zero payments (DEBT_HAS_PAYMENTS)
- All amounts validated as positive numeric strings via Zod refine()

## Business Logic

- `remaining_amount` stored denormalized on Debt for query performance (decided in 05-01)
- Status auto-transitions ACTIVE -> PAID when remaining_amount reaches 0
- Supports partial payments (DEBT-04: optional description on both debts and payments)
- Multiple open debts between same two financiers is allowed
- All financial calculations use Decimal.js `.plus()`, `.minus()` — never `.add()`, `.sub()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Decimal construction from Prisma Decimal objects**
- **Found during:** Task 2 (debt.service.ts)
- **Issue:** The plan used `new Decimal(debt.remaining_amount)` directly, but Prisma returns Decimal objects that can cause precision issues if not converted via `.toString()` first
- **Fix:** Changed all Prisma Decimal field reads to `new Decimal(debt.remaining_amount.toString())` in pay(), getSummary(), getFinancierSummary(), and getMatrix()
- **Files modified:** apps/backend/src/modules/debt/debt.service.ts
- **Commit:** e2eaa53

## Self-Check: PASSED

Files created:
- apps/backend/src/modules/debt/debt.schema.ts — FOUND
- apps/backend/src/modules/debt/debt.service.ts — FOUND
- apps/backend/src/modules/debt/debt.routes.ts — FOUND
- apps/backend/src/modules/debt/index.ts — FOUND

Commits:
- 2b12713 feat(05-02): add debt Zod validation schemas — FOUND
- e2eaa53 feat(05-02): add DebtService with full business logic — FOUND
- 244d29c feat(05-02): add debt Fastify route definitions — FOUND
- 83c9f17 feat(05-02): add debt module barrel index.ts — FOUND
- 5a3cb94 feat(05-02): register debt routes in app.ts under /api/debts — FOUND

TypeScript: No errors in debt module (pre-existing seed.ts rootDir issue unrelated to this plan).
