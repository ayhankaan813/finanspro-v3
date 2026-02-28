---
phase: 02-tables-and-grids
plan: "02"
subsystem: frontend-responsive
tags: [responsive, grid, tailwind, breakpoints]
dependency_graph:
  requires: []
  provides: [GRID-01, GRID-02, GRID-03, GRID-04, GRID-05]
  affects: [sites-list, partners-list, financiers-list, external-parties-list]
tech_stack:
  added: []
  patterns: [tailwind-sm-breakpoint, mobile-first-grid]
key_files:
  created: []
  modified:
    - apps/frontend/src/app/(dashboard)/sites/page.tsx
    - apps/frontend/src/app/(dashboard)/partners/page.tsx
    - apps/frontend/src/app/(dashboard)/financiers/page.tsx
    - apps/frontend/src/app/(dashboard)/external-parties/page.tsx
decisions:
  - "Use sm:grid-cols-2 (640px) instead of md:grid-cols-2 (768px) as the first multi-column breakpoint on all four entity list pages"
  - "Remove redundant xl:grid-cols-3 from partners and financiers pages since lg:grid-cols-3 already covers 1024px and above"
  - "Preserve xl:grid-cols-4 on external-parties page as it is a distinct value from lg:grid-cols-3"
metrics:
  duration: "~2 min"
  completed_date: "2026-02-28"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 02 Plan 02: Fix Card Grid Breakpoints on All Four Entity List Pages Summary

**One-liner:** Shifted all four entity list page card grids from md:grid-cols-2 (768px) to sm:grid-cols-2 (640px) so the two-column layout activates 128px earlier, filling wasted space at tablet-portrait widths.

## What Was Built

Changed the primary multi-column breakpoint in the card grid `div` on four list pages from `md:` (768px) to `sm:` (640px). Also removed redundant `xl:grid-cols-3` from partners and financiers pages where `lg:grid-cols-3` already covered it.

### Changes by File

| File | Old Class | New Class |
|------|-----------|-----------|
| sites/page.tsx (line 941) | `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6` | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6` |
| partners/page.tsx (line 504) | `grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3` | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` |
| financiers/page.tsx (line 1072) | `grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3` | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` |
| external-parties/page.tsx (line 268) | `grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |

## Tasks Completed

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Fix sites and partners list page grid breakpoints | e96912b | sites/page.tsx, partners/page.tsx |
| Task 2: Fix financiers and external-parties list page grid breakpoints | b0b611f | financiers/page.tsx, external-parties/page.tsx |

## Success Criteria Verification

- At 640px (sm:): all four list pages show 2-column card grids — YES (sm:grid-cols-2 in all four)
- At 375px: all four list pages show single-column card grids — YES (grid-cols-1 base, no smaller override)
- At 1024px+ (lg:): partners/financiers show 3 columns; external-parties shows 3 columns — YES (lg:grid-cols-3 in all three)
- At 1280px+ (xl:): sites shows 3 columns; external-parties shows 4 columns — YES (xl:grid-cols-3 and xl:grid-cols-4 preserved)
- No other grid classNames in these files modified — YES (only the main card grid div was touched)
- No TypeScript errors introduced — YES (pre-existing errors in kasa-raporu/page.tsx are unrelated)

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Items

Pre-existing TypeScript errors in `apps/frontend/src/app/(dashboard)/reports/kasa-raporu/page.tsx` were detected during the TypeScript check. These errors (`useKasaRaporu` and `KasaRaporuRow` not exported from `use-api`) are unrelated to this plan's changes and pre-date this execution. Logged for awareness only.

## Self-Check: PASSED

- sites/page.tsx contains `sm:grid-cols-2` at line 941 — FOUND
- partners/page.tsx contains `sm:grid-cols-2` at line 504 — FOUND
- financiers/page.tsx contains `sm:grid-cols-2` at line 1072 — FOUND
- external-parties/page.tsx contains `sm:grid-cols-2` at line 268 — FOUND
- Commit e96912b exists — FOUND
- Commit b0b611f exists — FOUND
