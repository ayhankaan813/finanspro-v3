---
phase: 06-borc-alacak-yonetim-sayfasi
plan: 02
subsystem: ui
tags: [react, nextjs, tanstack-query, shadcn, debt-management, dialogs, tables]

# Dependency graph
requires:
  - phase: 06-01
    provides: "Debt hooks (useDebts, useCreateDebt, usePayDebt, useCancelDebt), borclar page skeleton, sidebar nav"
provides:
  - Acik Borclar tab with filterable+expandable debt table and progress bars
  - Islem Gecmisi tab with chronological debt overview
  - Create Debt dialog (lender/borrower selects, amount, description)
  - Payment dialog with Tamami Ode quick-fill
  - Cancel dialog with warning and optional reason
affects:
  - 06-03 (matrix tab fills the remaining placeholder)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Expandable table rows via expandedDebtId state toggle
    - Progress bar via plain div width percentage (no shadcn Progress needed)
    - Mutation argument keys match hook signatures exactly (debtId, cancellation_reason)

key-files:
  created: []
  modified:
    - apps/frontend/src/app/(dashboard)/borclar/page.tsx

key-decisions:
  - "Progress bar implemented with plain div width% (shadcn Progress component not available in project)"
  - "Cancel button shown only when no payments exist (UI-side guard matching backend rule)"
  - "DebtListResponse.pagination lacks hasPrev/hasNext — computed from page/totalPages comparison"

patterns-established:
  - "Expandable row pattern: expandedDebtId state + useDebt(expandedDebtId) for lazy payment fetch"
  - "Dialog pattern: separate open/close handlers that reset form state"
  - "Mutation error handling: try/catch with toast notifications"

requirements-completed: [PAGE-01, PAGE-02, PAGE-03]

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 6 Plan 02: Borclar Tabs and Dialogs Summary

**Filterable debt table with expandable rows, three action dialogs (create/pay/cancel), and chronological history tab — fully wired to React Query debt hooks**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-01T13:25:00Z
- **Completed:** 2026-03-01T13:33:32Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced placeholder Acik Borclar TabsContent with filterable, paginated debt table (financier + status filters)
- Added expandable rows that lazily fetch payment history via useDebt(expandedDebtId) and show action buttons
- Added red/amber/green progress bars showing paid percentage of each debt
- Replaced placeholder Islem Gecmisi TabsContent with chronological debt list table
- Wired "Yeni Borc" header button to Create Debt dialog with lender-not-borrower validation
- Added Payment dialog with remaining amount display and "Tamami Ode" quick-fill button
- Added Cancel dialog with AlertTriangle warning and optional cancellation reason field
- Kept Finansor Matrix tab as placeholder for 06-03

## Task Commits

1. **Task 1: Full borclar page implementation** - `3df516b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/frontend/src/app/(dashboard)/borclar/page.tsx` — Complete rewrite with all tab contents and dialogs (835 insertions, 23 deletions)

## Decisions Made

- **Progress bar as plain div:** shadcn Progress component is not installed in this project. Used a plain `div` with inline `style={{ width: '${progress}%' }}` and Tailwind color class — functionally equivalent, zero dependencies.
- **Cancel button guard:** Backend requires no payments for cancellation. UI hides the "Iptal Et" button when `expandedDebt.payments.length > 0`, matching backend rule. The check also gracefully waits during `isLoadingExpanded`.
- **Pagination without hasNext/hasPrev:** `DebtListResponse.pagination` only provides `page` and `totalPages`. Derived `hasPrev = page > 1` and `hasNext = page < totalPages` inline.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected mutation argument keys to match hook signatures**
- **Found during:** Task 1 (during implementation, pre-verification)
- **Issue:** Plan spec used `id` and `reason` but actual hooks expect `debtId` and `cancellation_reason`
- **Fix:** Used `debtId` for both usePayDebt and useCancelDebt; used `cancellation_reason` for useCancelDebt
- **Files modified:** apps/frontend/src/app/(dashboard)/borclar/page.tsx
- **Verification:** Checked hook source at lines 2425 and 2443 in use-api.ts
- **Committed in:** 3df516b (Task 1 commit)

**2. [Rule 1 - Bug] Fixed pagination to not use hasPrev/hasNext (not in DebtListResponse)**
- **Found during:** Task 1 (interface inspection)
- **Issue:** Plan mentioned hasPrev/hasNext but DebtListResponse.pagination only has page/limit/total/totalPages
- **Fix:** Computed disabled state as `page <= 1` and `page >= totalPages` directly
- **Files modified:** apps/frontend/src/app/(dashboard)/borclar/page.tsx
- **Verification:** Checked DebtListResponse interface at line 2322 in use-api.ts
- **Committed in:** 3df516b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bug fixes from interface mismatch between plan spec and actual hook signatures)
**Impact on plan:** All fixes necessary for correctness. No scope creep. All plan requirements satisfied.

## Issues Encountered

- Pre-existing TypeScript errors in `apps/frontend/src/app/(dashboard)/reports/kasa-raporu/page.tsx` (missing `useKasaRaporu` hook export). Out of scope — logged to deferred items. Zero errors in borclar/page.tsx.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- borclar/page.tsx fully implements PAGE-01, PAGE-02, PAGE-03 requirements
- Finansor Matrix tab (value="matrix") placeholder is intact and ready for 06-03 to fill in
- All debt mutations invalidate relevant query caches automatically

---
*Phase: 06-borc-alacak-yonetim-sayfasi*
*Completed: 2026-03-01*
