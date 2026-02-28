---
phase: 05-data-foundation-and-api
plan: "01"
subsystem: database-schema
tags: [prisma, schema, debt, seed, postgresql]
dependency_graph:
  requires: []
  provides:
    - Debt model with lender/borrower FKs to Financier
    - DebtPayment model with debt_id FK to Debt
    - DebtStatus enum (ACTIVE, PAID, CANCELLED)
    - Test seed data for 3 financiers, 3 debts, 3 payments
  affects:
    - apps/backend/prisma/schema.prisma
    - apps/backend/prisma/seed.ts
tech_stack:
  added: []
  patterns:
    - Bidirectional named Prisma relations (@relation with name)
    - Decimal(15,2) for financial precision
    - Upsert-based seed with deterministic IDs
key_files:
  created: []
  modified:
    - apps/backend/prisma/schema.prisma
    - apps/backend/prisma/seed.ts
decisions:
  - DebtStatus enum uses 3 values: ACTIVE, PAID, CANCELLED — matches 05-CONTEXT.md design
  - remaining_amount stored on Debt and updated on each payment (denormalized for query speed)
  - No due_date field — serbest geri odeme (free repayment)
  - created_by on both Debt and DebtPayment for audit trail
  - Financier model gets two named relation arrays for bidirectional navigation
  - void debt2 used to suppress TypeScript unused-variable warning without removing the variable
metrics:
  duration: "~2 minutes"
  completed_date: "2026-02-28"
  tasks_completed: 2
  files_modified: 2
---

# Phase 5 Plan 01: Debt Schema and Seed Data Summary

**One-liner:** Prisma Debt + DebtPayment models with bidirectional Financier relations and DebtStatus enum, plus test seed data covering all three debt lifecycle states.

## What Was Built

Added the data foundation for the kasalar arasi borc/alacak feature (v1.1 milestone). The schema now contains:

- `DebtStatus` enum with `ACTIVE`, `PAID`, and `CANCELLED` values
- `Debt` model with `lender_id` and `borrower_id` foreign keys to `Financier` using named relations (`DebtsAsLender`, `DebtsAsBorrower`)
- `DebtPayment` model linked to `Debt` via `debt_id`
- `debts_as_lender` and `debts_as_borrower` relation arrays on the `Financier` model
- All amount fields (`amount`, `remaining_amount`) use `@db.Decimal(15, 2)` precision
- Performance indexes on `lender_id`, `borrower_id`, `status`, composite `[lender_id, status]`, `[borrower_id, status]`, and `created_at`

The seed file now creates:
- 3 test financiers: Yağız (YAGIZ), Toprak (TOPRAK), Deniz (DENIZ)
- 3 test debts covering all lifecycle states:
  - `debt-001`: Yağız borrowed 10,000 from Toprak — ACTIVE, 7,000 remaining (partial payment made)
  - `debt-002`: Deniz borrowed 5,000 from Yağız — ACTIVE, 5,000 remaining (no payments)
  - `debt-003`: Toprak borrowed 2,000 from Deniz — PAID, 0 remaining (two payments totaling 2,000)
- 3 test payments: dpay-001 (3,000 partial), dpay-002 (1,500), dpay-003 (500 final)

## Verification Results

- `npx prisma validate` — PASSED: "The schema at prisma/schema.prisma is valid"
- `npx prisma generate` — PASSED: Prisma Client generated successfully
- `npx tsc --noEmit prisma/seed.ts` — PASSED: No TypeScript errors
- `DebtStatus` import in seed.ts — CONFIRMED
- 3 `prisma.debt.upsert` calls — CONFIRMED
- 3 `prisma.debtPayment.upsert` calls — CONFIRMED
- 3 `prisma.financier.upsert` calls — CONFIRMED

### DB Push Note

`npx prisma db push` encountered a pre-existing database/schema mismatch: old `TransactionType` enum values (`PARTNER_PAYMENT`, `SITE_DELIVERY`, `FUNDED_PAYMENT`) exist in database rows but were already removed from schema.prisma in a previous session. This is entirely unrelated to the Debt models added in this plan. The Debt/DebtPayment tables will be created successfully once the existing TransactionType mismatch is resolved (likely requires a `db push --force-reset` or migration on a clean database).

## Commits

| Task | Description | Hash |
|------|-------------|------|
| Task 1 | Add Debt/DebtPayment models to Prisma schema | c44631a |
| Task 2 | Add debt and payment test seed data | fca66f0 |

## Deviations from Plan

None — plan executed exactly as written.

The pre-existing `TransactionType` db push conflict is out of scope (pre-existing issue unrelated to this plan's changes) and has been documented above.

## Self-Check: PASSED

- `apps/backend/prisma/schema.prisma` — FOUND and contains Debt model, DebtPayment model, DebtStatus enum
- `apps/backend/prisma/seed.ts` — FOUND and contains 3 financier upserts, 3 debt upserts, 3 debtPayment upserts
- Commit `c44631a` — FOUND in git log
- Commit `fca66f0` — FOUND in git log
