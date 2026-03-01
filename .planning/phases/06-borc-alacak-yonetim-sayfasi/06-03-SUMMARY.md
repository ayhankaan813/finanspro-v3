---
phase: 06-borc-alacak-yonetim-sayfasi
plan: "03"
subsystem: ui
tags: [react, next.js, react-query, tailwind, debt, matrix, heat-map]

# Dependency graph
requires:
  - phase: 06-borc-alacak-yonetim-sayfasi
    plan: "01"
    provides: useDebtMatrix hook, DebtMatrixResponse interface in use-api.ts
  - phase: 06-borc-alacak-yonetim-sayfasi
    plan: "02"
    provides: borclar/page.tsx with Acik Borclar and Islem Gecmisi tabs, all dialogs
provides:
  - Finansor Matrix cross-table (lender rows x borrower columns) with heat map coloring
  - Diagonal cell (self-reference) disabled styling with em-dash
  - Row totals (Toplam Alacak per lender) and column totals (Toplam Borc per borrower)
  - Grand total cell (sum of all active debts)
  - Sticky first column for horizontal scroll on narrow screens
  - Loading skeleton and empty-state when no active debts
  - Color legend for heat map levels (Kendisi / Dusuk / Orta / Yuksek)
affects:
  - Phase 07 (any future phase building on complete borclar page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Heat map via ratio = amount/maxAmount, 5-level sky-50 to blue-300 color scale"
    - "matrixMap: Map<lender_id, Map<borrower_id, amount>> for O(1) cell lookup"
    - "Sticky first column (sticky left-0 bg-white z-10) inside overflow-x-auto wrapper"
    - "Diagonal detection: lender.id === borrower.id"

key-files:
  created: []
  modified:
    - apps/frontend/src/app/(dashboard)/borclar/page.tsx

key-decisions:
  - "Heat map color scale is relative to max amount in current dataset, not a fixed threshold — scales gracefully with any data range"
  - "Zero-value cells render empty string (no '0,00 TL' text) for clean visual appearance"
  - "matrixFinanciers.length === 0 OR matrixEntries.length === 0 triggers empty state — covers both no-financiers and no-active-debts cases"

patterns-established:
  - "Matrix cross-table: Map-of-Maps for O(1) lookup, iterate financiers for both axes"
  - "Row/column totals computed client-side from matrixMap during render, not from API"

requirements-completed:
  - PAGE-04

# Metrics
duration: 2min
completed: "2026-03-01"
---

# Phase 6 Plan 03: Finansor Matrix Tab Summary

**Inter-financier debt cross-table with 5-level heat map coloring, diagonal-disabled cells, row/column totals, and sticky first column — completing all four Phase 6 requirements.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T13:36:14Z
- **Completed:** 2026-03-01T13:38:08Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced matrix tab placeholder with fully functional cross-table (lender rows x borrower columns)
- Implemented 5-level heat map (bg-sky-50 to bg-blue-300) scaled relative to max amount in dataset
- Added diagonal cells (self-reference) with bg-slate-100 background and em-dash symbol
- Row totals (Toplam Alacak) and column totals (Toplam Borc) with grand total in bottom-right cell
- Sticky first column (lender names) for horizontal scroll on mobile/narrow screens
- Loading skeleton and empty-state message when no active debts exist
- Color legend below the table (Kendisi / Dusuk / Orta / Yuksek)
- All other tabs (Acik Borclar, Islem Gecmisi), summary cards, and dialogs untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace the matrix tab placeholder with the cross-table implementation** - `87c8cfd` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/frontend/src/app/(dashboard)/borclar/page.tsx` - Added useDebtMatrix import/hook, matrixMap/rowTotals/colTotals helpers, getHeatMapColor function, and full matrix TabsContent replacing placeholder

## Decisions Made

- Heat map color scale is relative to max amount in current dataset (not fixed thresholds) — scales gracefully with any data range.
- Zero-value cells render empty string for clean visual appearance (not "0,00 TL").
- Empty state triggers when either financiers or entries are absent, covering both no-data edge cases.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors in unrelated `kasa-raporu/page.tsx` (missing `useKasaRaporu` hook) were noted but are out-of-scope — logged as deferred.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 is now fully complete: PAGE-01 (summary cards), PAGE-02 (financier breakdown), PAGE-03 (Acik Borclar + Islem Gecmisi tabs), PAGE-04 (Finansor Matrix tab) all satisfied.
- borclar/page.tsx is production-ready with all four requirements met.
- Phase 7 can begin without any blockers from Phase 6.

---
*Phase: 06-borc-alacak-yonetim-sayfasi*
*Completed: 2026-03-01*
