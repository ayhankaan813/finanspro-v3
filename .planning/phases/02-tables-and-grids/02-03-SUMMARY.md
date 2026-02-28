---
phase: 02-tables-and-grids
plan: 03
subsystem: ui
tags: [tailwind, responsive, mobile, table, whitespace-nowrap, edge-to-edge]

# Dependency graph
requires:
  - phase: 02-tables-and-grids
    provides: overflow-x-auto scroll wrappers already in place on all target tables
provides:
  - "-mx-3 sm:mx-0 edge-to-edge table Card wrappers on daily, monthly, reconciliation, external-parties/[id] pages"
  - "whitespace-nowrap on all th/td cells in financiers/[id], daily, monthly, external-parties/[id] tables"
affects:
  - 03-transaction-pages
  - 04-organization-pages

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "-mx-3 sm:mx-0 wrapper div pattern for edge-to-edge Cards on mobile (offsets container px-3)"
    - "whitespace-nowrap on th/td for single-line cell content to engage overflow-x-auto scrolling"

key-files:
  created: []
  modified:
    - apps/frontend/src/app/(dashboard)/reports/daily/page.tsx
    - apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx
    - apps/frontend/src/app/(dashboard)/reports/reconciliation/page.tsx
    - apps/frontend/src/app/(dashboard)/external-parties/[id]/page.tsx
    - apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx

key-decisions:
  - "reconciliation/page.tsx: added -mx-3 sm:mx-0 to existing motion.div wrapper (no new div) because the motion.div is already the outermost element around the Card"
  - "reconciliation/page.tsx: TABL-03 not applicable — page uses div-based flex layout with no table/th/td elements; font-amount class provides nowrap"
  - "financiers/[id]/page.tsx: TABL-02 not applicable — CardContent has p-0 leaving no padding for -mx-3 to offset"
  - "daily/page.tsx: font-amount td cell skipped for whitespace-nowrap since globals.css already provides white-space: nowrap via .font-amount"

patterns-established:
  - "Edge-to-edge pattern: wrap Card in <div className='-mx-3 sm:mx-0'> to offset container's px-3; Card keeps all existing classes"
  - "Nowrap pattern: add whitespace-nowrap to th/td directly on the element, not on inner spans"

requirements-completed: [TABL-01, TABL-02, TABL-03, GRID-01, GRID-02, GRID-03, GRID-04, GRID-05]

# Metrics
duration: 9min
completed: 2026-02-28
---

# Phase 2 Plan 03: Gap Closure — Edge-to-Edge Cards and Cell Nowrap Summary

**-mx-3 sm:mx-0 wrappers on four table Cards plus whitespace-nowrap on all th/td cells in five tables, closing TABL-02 and TABL-03 verification gaps**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-28T21:42:22Z
- **Completed:** 2026-02-28T21:51:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `-mx-3 sm:mx-0` edge-to-edge wrappers to table Cards on daily, monthly, reconciliation, and external-parties/[id] pages — tables now extend flush to viewport edges on mobile (375px)
- Added `whitespace-nowrap` to all th and td cells on financiers/[id], daily, monthly, and external-parties/[id] pages — cell content now forces single-line, engaging overflow-x-auto scroll instead of wrapping
- All pre-existing `overflow-x-auto` wrappers preserved; no regressions on desktop (sm: breakpoint restores Card positioning)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add -mx-3 sm:mx-0 edge-to-edge wrappers to table Cards** - `2eb78aa` (feat)
2. **Task 2: Add whitespace-nowrap to table cells on five pages** - `e1202bf` (feat)

## Files Created/Modified

- `apps/frontend/src/app/(dashboard)/reports/daily/page.tsx` — Transactions Table Card wrapped in `-mx-3 sm:mx-0` div; desktop table th/td cells gain `whitespace-nowrap`
- `apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx` — Main Table Card wrapped in `-mx-3 sm:mx-0` div; desktop table th/td/tfoot cells (9 cols) gain `whitespace-nowrap`
- `apps/frontend/src/app/(dashboard)/reports/reconciliation/page.tsx` — `-mx-3 sm:mx-0` added to existing `motion.div` wrapper; TABL-03 not applicable (no table elements)
- `apps/frontend/src/app/(dashboard)/external-parties/[id]/page.tsx` — Data Table Card wrapped in `-mx-3 sm:mx-0` inside conditional render; all th/td cells in monthly and daily views gain `whitespace-nowrap`
- `apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` — TABL-02 not applicable; all th/td cells across thead, both tbody row types (daily + monthly), and tfoot gain `whitespace-nowrap`

## Decisions Made

- **reconciliation motion.div**: Added `-mx-3 sm:mx-0` directly to the existing `motion.div` element rather than inserting a new wrapper div, per plan instructions, to avoid adding unnecessary DOM nesting between Framer Motion element and Card.
- **reconciliation TABL-03 skip**: No `<table>`, `<th>`, or `<td>` elements on this page — it uses div-based flex layout. All financial values use `.font-amount` class which already has `white-space: nowrap` in globals.css.
- **financiers TABL-02 skip**: CardContent uses `p-0` so there is no padding for the negative margin to offset. Already correctly excluded per Plan 01 rationale.
- **daily font-amount td skip**: The amount `<td>` already has `font-amount` class providing nowrap via globals.css; adding `whitespace-nowrap` was skipped to avoid redundancy, though both approaches are equivalent.

## Deviations from Plan

None - plan executed exactly as written. All per-file instructions followed precisely.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TABL-02 and TABL-03 gaps are fully closed — all four target files have `-mx-3 sm:mx-0` and all five tables have `whitespace-nowrap` on their cells
- Phase 2 (Tables and Grids) plan 03 of 4 complete; one plan remaining in this phase
- No blockers; responsive table behavior is now consistent across the entire dashboard

## Self-Check: PASSED

All 5 modified files confirmed present. Both task commits (2eb78aa, e1202bf) confirmed in git log.

---
*Phase: 02-tables-and-grids*
*Completed: 2026-02-28*
