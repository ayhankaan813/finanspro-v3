---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [shadcn, dialog, tailwind, mobile, responsive, dvh]

# Dependency graph
requires: []
provides:
  - Mobile-safe DialogContent with max-w-[calc(100vw-32px)] sm:max-w-lg width constraints
  - Internal scroll via max-h-[90dvh] overflow-y-auto (iOS Safari safe with dvh)
  - Tighter mobile padding p-4 sm:p-6
affects: [all pages using Dialog — transaction forms, edit forms, approval dialogs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dvh (dynamic viewport height) instead of vh for iOS Safari address-bar-aware height capping"
    - "calc(100vw-32px) mobile width with sm: breakpoint fallback for desktop"

key-files:
  created: []
  modified:
    - apps/frontend/src/components/ui/dialog.tsx

key-decisions:
  - "Use dvh not vh for max-height so iOS Safari address-bar show/hide does not cause dialog height jumps"
  - "Single file fix in shared DialogContent benefits all 10+ dialog-based forms across the entire app"
  - "16px margin each side (calc(100vw-32px)) gives comfortable breathing room on 375px screens"

patterns-established:
  - "Mobile-first responsive width: max-w-[calc(100vw-Npx)] sm:max-w-lg pattern for modal content"
  - "dvh for viewport-relative heights in dialogs/modals"

requirements-completed: [GLOB-04]

# Metrics
duration: 1min
completed: 2026-02-28
---

# Phase 1 Plan 2: Mobile-Safe Dialog Summary

**shadcn DialogContent patched with calc(100vw-32px) width cap, 90dvh height limit, and internal scroll — all dialogs now fit within 375px viewport without clipping**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-28T18:46:36Z
- **Completed:** 2026-02-28T18:47:18Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments

- Fixed dialog right-edge clipping on 375px mobile screens by replacing bare `max-w-lg` (512px) with `max-w-[calc(100vw-32px)] sm:max-w-lg`
- Added `max-h-[90dvh] overflow-y-auto` so tall forms (transaction, edit) scroll internally rather than pushing past the viewport bottom
- Reduced mobile padding from `p-6` to `p-4 sm:p-6` to maximize content space on small screens
- Used `dvh` (dynamic viewport height) instead of `vh` to prevent iOS Safari address-bar-triggered height jumps

## Task Commits

Each task was committed atomically:

1. **Task 1: Update DialogContent className with mobile-safe constraints** - `2dabb87` (fix)

**Plan metadata:** (included in docs commit below)

## Files Created/Modified

- `apps/frontend/src/components/ui/dialog.tsx` - DialogContent className updated with mobile-safe width, height, padding, and scroll constraints

## Decisions Made

- Used `dvh` instead of `vh` for the 90% max-height constraint — `dvh` accounts for iOS Safari's dynamic address bar, preventing the dialog height from jumping when the bar appears/disappears
- Applied fix to the single shared `DialogContent` component so every dialog-based form across the app benefits from one edit with no per-page changes required

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors were found in `apps/frontend/src/app/(dashboard)/reports/kasa-raporu/page.tsx` (missing exports `useKasaRaporu` and `KasaRaporuRow`). These are unrelated to dialog.tsx and were present before this plan. Not fixed per scope boundary rule.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All shadcn Dialogs across the app now render safely on 375px screens
- Close button (X) is reachable and tappable at 375px
- iOS Safari height jump fix in place via `dvh`
- Ready to proceed to Plan 03 of Foundation phase

---
*Phase: 01-foundation*
*Completed: 2026-02-28*
