---
phase: quick-sticky-date-column
plan: 1
subsystem: frontend-tables
tags: [sticky, table, mobile, responsive, ux]
dependency_graph:
  requires: []
  provides: [sticky-date-column-monthly, sticky-date-column-financier]
  affects: [reports/monthly/page.tsx, financiers/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [sticky left-0, z-10/z-20 for corner cells, bg-white on tbody, group-hover propagation]
key_files:
  created: []
  modified:
    - apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx
    - apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx
decisions:
  - "Use group-hover:bg-twilight-50/50 on monthly tbody td instead of bg-inherit, because the tr does not set an explicit background-color (only hover pseudo-class), so bg-inherit would inherit the table's white background regardless of hover state"
  - "Use z-20 on financier thead/tfoot corner cells (sticky both top/bottom AND left) to stay above both scroll axes"
metrics:
  duration: 45s
  completed_date: "2026-02-28T22:09:25Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Quick Task 1: Sticky First Column (Date) on Report Tables Summary

**One-liner:** Pinned date column via `sticky left-0 z-10` on monthly report and financier detail tables, with explicit background colors matching each section to eliminate text bleed-through on horizontal scroll.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add sticky date column to monthly report table | 8d4b81f | apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx |
| 2 | Add sticky date column to financier detail table | 0fd727b | apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx |

## What Was Done

### Task 1 - Monthly Report Table

Applied sticky classes to the 3 date cells in the desktop table (`hidden sm:table`):

- **thead th** (`Tarih`): Added `sticky left-0 z-10 bg-twilight-900` — matches the dark header row background.
- **tbody td** (date per row): Added `sticky left-0 z-10 bg-white group-hover:bg-twilight-50/50` — white base, inherits hover state via `group-hover` since the row has `group` class.
- **tfoot td** (`TOPLAM`): Added `sticky left-0 z-10 bg-twilight-900` — matches the dark footer row background.

Mobile card view (`sm:hidden`) was not touched — it is a div-based layout and does not scroll horizontally.

### Task 2 - Financier Detail Table

Applied sticky classes to 4 date cells in the scroll-nested table (`max-h-[65vh] overflow-y-auto > overflow-x-auto > table`):

- **thead th** (`TARIH`): Added `sticky left-0 z-20 bg-twilight-50/95` — z-20 because thead is already `sticky top-0 z-10`; the corner cell needs a higher z-index to stay above both scroll axes.
- **tbody td** (daily rows — `{day.day}`): Added `sticky left-0 z-10 bg-white`.
- **tbody td** (monthly rows — `{row.monthName}`): Added `sticky left-0 z-10 bg-white`.
- **tfoot td** (`TOPLAM`): Added `sticky left-0 z-20 bg-twilight-900` — z-20 because tfoot is already `sticky bottom-0 z-10`; same corner cell logic.

## Decisions Made

1. **group-hover on monthly tbody td:** Cannot use `bg-inherit` because the `<tr>` only sets `hover:bg-twilight-50/50` (a pseudo-class), not an actual background-color. `bg-inherit` would inherit the table's white background and never show the hover tint. Instead, `group-hover:bg-twilight-50/50` explicitly mirrors the row's hover state on the sticky cell.

2. **z-20 on financier corner cells:** The thead and tfoot are already `sticky top-0 z-10` and `sticky bottom-0 z-10` respectively. Adding `sticky left-0` without increasing z-index would cause the corner cell to slip under sibling sticky rows on the perpendicular axis. z-20 ensures it stays on top of both.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `grep -c "sticky left-0" apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx` → 3 (PASS)
- [x] `grep -c "sticky left-0" apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` → 4 (PASS)
- [x] Commits 8d4b81f and 0fd727b exist in git log

## Self-Check: PASSED
