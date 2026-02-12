---
description: Run comprehensive financial audit with specialized agent team
requires_approval: false
---

Launch a 3-teammate Agent Team to perform a comprehensive system audit on FinansPro v3.

## Team Structure

### Team Lead (You - Orchestrator)
- Coordinate all teammates
- Synthesize findings into final report
- Make prioritization decisions
- Act as Devil's Advocate on teammate findings

### Teammate 1: Backend & Financial Systems Auditor
**Working directory:** `apps/backend/`
**Responsibilities:**
1. Double-entry ledger balance verification (DEBIT = CREDIT for all entries)
2. Commission calculation accuracy (6% site + 1.5% partner + 2.5% financier + 2% org = 12%)
3. Decimal.js usage audit - flag any `.add()`, `.sub()`, `.mul()`, `.div()` usage (must use `.plus()`, `.minus()`, `.times()`, `.dividedBy()`)
4. Running balance calculation direction (must be BACKWARD: current → previous)
5. API endpoint security (auth middleware, input validation with Zod)
6. Prisma query performance (N+1 queries, missing indexes, unoptimized aggregations)
7. Database integrity (orphaned records, constraint violations)

**Key files to audit:**
- `src/modules/transaction/commission.service.ts` - Commission logic
- `src/modules/site/site.service.ts` (lines 480-640) - Running balance
- `src/modules/ledger/ledger.service.ts` - Ledger entries
- `src/modules/organization/organization.service.ts` (lines 274-336) - Org analytics
- `prisma/schema.prisma` - Data model integrity

### Teammate 2: Frontend & UX Auditor
**Working directory:** `apps/frontend/`
**Responsibilities:**
1. React Query hook correctness (staleTime, cache invalidation, error handling)
2. Type safety between API responses and frontend interfaces in `use-api.ts`
3. Financial data display accuracy (Decimal formatting, currency symbols, rounding)
4. Responsive layout integrity (mobile, tablet, desktop)
5. Component error boundaries and loading states
6. Accessibility basics (aria labels, keyboard navigation)
7. Bundle size and performance (unnecessary re-renders, large imports)

**Key files to audit:**
- `src/hooks/use-api.ts` - All React Query hooks and interfaces
- `src/app/(dashboard)/organization/page.tsx` - Org analytics UI
- `src/app/(dashboard)/sites/[id]/page.tsx` - Site detail page
- `src/stores/auth.ts` - Auth state management
- `src/lib/api-client.ts` - API client configuration

### Teammate 3: QA & Security Auditor
**Responsibilities:**
1. Cross-layer data consistency (backend response matches frontend display)
2. Auth flow security (JWT expiration, token refresh, protected routes)
3. Environment variable exposure (no secrets in frontend bundle)
4. CORS configuration review
5. SQL injection vectors (even with Prisma, check raw queries)
6. Input validation completeness (Zod schemas cover all endpoints)
7. Error message information leakage
8. Seed data integrity verification against expected values:
   - Organization balance = 22.00 TL
   - Ledger: total DEBIT = total CREDIT
   - Commission snapshots = 2 records

## Execution Rules
- This audit is **READ-ONLY** - no data will be modified
- Each teammate reports findings independently
- Teammates should message each other when they find cross-layer issues
- Team Lead synthesizes all findings into a single prioritized report

## Prerequisites
- Backend running on http://localhost:3001
- Frontend running on http://localhost:3000
- PostgreSQL database accessible
- Auth credentials: admin / admin123

## Output Format
Generate a comprehensive audit report with:
- ✅ Passed checks (with evidence)
- ⚠️ Warnings (medium priority)
- ❌ Critical issues (must fix)
- 🔧 Recommended fixes (prioritized action items)
- 📊 Summary score (X/100)

Start the agent team audit now.
