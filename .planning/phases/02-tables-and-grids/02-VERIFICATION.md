---
phase: 02-tables-and-grids
verified: 2026-02-28T23:10:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 6/8
  gaps_closed:
    - "TABL-02: Table wrappers now have -mx-3 sm:mx-0 — confirmed in all four target files (daily, monthly, reconciliation, external-parties/[id])"
    - "TABL-03: Table cells now have whitespace-nowrap — confirmed in all four table files (financiers/[id], daily, monthly, external-parties/[id])"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Financier detail table horizontal scroll at 375px"
    expected: "9-column table scrolls horizontally; all columns (TARİH, YAT., ÇEKİM, ÖDEME, TAK., TES., T.KOM., KOM., BAKİYE) are reachable by scrolling"
    why_human: "overflow-x-auto + min-w-[560px] is in place, but visual confirmation at real 375px width is needed to confirm no column clipping"
  - test: "Financier detail table sticky header/footer during vertical scroll"
    expected: "thead row stays pinned at top and tfoot row stays pinned at bottom while scrolling through many rows"
    why_human: "overflow-x-auto is nested inside overflow-y-auto. sticky positioning inside nested scroll containers can fail in Safari"
  - test: "GRID-01 dashboard stats grid at 375px"
    expected: "Dashboard overview cards display in 1 column at 375px and 2+ columns at wider widths with no content overflow"
    why_human: "Dashboard uses grid-cols-1 lg:grid-cols-12 as a two-region layout (not a stats card row). Visual confirmation that no overflow occurs at 375px is needed."
  - test: "Edge-to-edge Card appearance on mobile"
    expected: "On a 375px device, table Cards on daily, monthly, reconciliation, and external-parties/[id] pages extend flush to viewport edges. On tablet/desktop (640px+) Cards have normal rounded-corner appearance with spacing."
    why_human: "-mx-3 sm:mx-0 pattern requires visual confirmation that the negative margin offsets the container px-3 correctly and sm: restores the Card to its normal box on wider screens"
---

# Phase 02: Tables and Grids Verification Report

**Phase Goal:** Every table in the application is horizontally scrollable on mobile and every card grid collapses to a single column on mobile without content overflow
**Verified:** 2026-02-28T23:10:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure plan 02-03

---

## Re-Verification Summary

Previous verification (2026-02-28T21:28:41Z) found 2 gaps:

1. **TABL-02** — Zero occurrences of `-mx-3 sm:mx-0` on any table wrapper
2. **TABL-03** — Zero occurrences of `whitespace-nowrap` on table cells (except one pre-existing cell in kasa-raporu)

Gap closure plan 02-03 was executed and committed as two atomic commits:

- `2eb78aa` — feat(02-03): add -mx-3 sm:mx-0 edge-to-edge table Card wrappers
- `e1202bf` — feat(02-03): add whitespace-nowrap to table cells on four pages

**Both gaps are now closed.** The status advances from `gaps_found` to `human_needed` — all automated checks pass, three human visual tests remain from the initial verification plus one new visual test for the edge-to-edge Card pattern.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Financier detail 9-column table is horizontally scrollable at 375px | ? HUMAN | `overflow-x-auto` at line 314 + `min-w-[560px]` at line 315 of financiers/[id]/page.tsx; visual confirmation needed |
| 2 | Financier detail sticky header/footer remain pinned during vertical scroll | ? HUMAN | `sticky top-0 z-10` on thead and `sticky bottom-0 z-10` on tfoot preserved; nested scroll container interaction needs visual check |
| 3 | Personnel desktop table (hidden sm:block) has horizontal scroll wrapper | ✓ VERIFIED | `<div className="hidden sm:block overflow-x-auto">` at line 522 of personnel/page.tsx; unchanged from Plan 01 |
| 4 | Pre-existing overflow-x-auto tables continue to work (no regressions) | ✓ VERIFIED | daily/page.tsx lines 376-377, monthly/page.tsx lines 312-313, kasa-raporu/page.tsx line 157, reconciliation/page.tsx line 231, external-parties/[id]/page.tsx line 785 — all confirmed present |
| 5 | Table wrappers use -mx-3 sm:mx-0 for full-bleed mobile scroll (TABL-02) | ✓ VERIFIED | daily line 366, monthly line 309, reconciliation line 224 (motion.div), external-parties line 783 — 4 occurrences confirmed |
| 6 | Table cells use whitespace-nowrap to prevent content wrapping (TABL-03) | ✓ VERIFIED | financiers/[id]: 36 occurrences; daily: 9; monthly: 27; external-parties/[id]: 15 — all on th/td elements |
| 7 | All four entity list pages show single column at 375px, two columns at 640px | ✓ VERIFIED | sites/page.tsx line 941: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`; partners line 504: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`; financiers line 1072: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`; external-parties line 268: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| 8 | Large-screen column counts preserved on all four list pages | ✓ VERIFIED | sites: xl:grid-cols-3; partners/financiers: lg:grid-cols-3; external-parties: lg:grid-cols-3 xl:grid-cols-4 |

**Score:** 6/8 fully verified, 2 require human visual confirmation (no automated failures)

---

## Required Artifacts

### Plan 01 Artifacts (TABL-01)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` | overflow-x-auto wrapper around 9-column table | ✓ VERIFIED | Line 314: `<div className="overflow-x-auto">` inside `max-h-[65vh] overflow-y-auto` container |
| `apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` | min-w-[560px] on table, table-fixed removed | ✓ VERIFIED | Line 315: `<table className="w-full min-w-[560px]">`, no `table-fixed` anywhere |
| `apps/frontend/src/app/(dashboard)/organization/personnel/page.tsx` | overflow-x-auto on hidden sm:block wrapper | ✓ VERIFIED | Line 522: `<div className="hidden sm:block overflow-x-auto">` |

### Plan 03 Artifacts (TABL-02, TABL-03) — Gap Closure

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/app/(dashboard)/reports/daily/page.tsx` | -mx-3 sm:mx-0 wrapper div around Transactions Table Card | ✓ VERIFIED | Line 366: `<div className="-mx-3 sm:mx-0">` wraps Card |
| `apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx` | -mx-3 sm:mx-0 wrapper div around Main Table Card | ✓ VERIFIED | Line 309: `<div className="-mx-3 sm:mx-0">` wraps Card |
| `apps/frontend/src/app/(dashboard)/reports/reconciliation/page.tsx` | -mx-3 sm:mx-0 on motion.div wrapper | ✓ VERIFIED | Line 224: `<motion.div className="-mx-3 sm:mx-0" ...>` |
| `apps/frontend/src/app/(dashboard)/external-parties/[id]/page.tsx` | -mx-3 sm:mx-0 wrapper div inside conditional render | ✓ VERIFIED | Line 783: `<div className="-mx-3 sm:mx-0">` inside `{viewMode !== "ledger" && (` |
| `apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` | whitespace-nowrap on all th/td cells | ✓ VERIFIED | 36 occurrences confirmed on th/td elements in thead, tbody, tfoot |
| `apps/frontend/src/app/(dashboard)/reports/daily/page.tsx` | whitespace-nowrap on desktop table th/td cells | ✓ VERIFIED | 9 occurrences; th at lines 382-386, td at lines 392, 395, 407, 417 |
| `apps/frontend/src/app/(dashboard)/reports/monthly/page.tsx` | whitespace-nowrap on th/td/tfoot cells (9 cols) | ✓ VERIFIED | 27 occurrences; th at lines 318-326, td/tfoot confirmed |
| `apps/frontend/src/app/(dashboard)/external-parties/[id]/page.tsx` | whitespace-nowrap on th and monthly+daily td cells | ✓ VERIFIED | 15 occurrences; th at lines 789, 792, 798, 804, 810; td at lines 829, 834, 837, 840, 843+ |

### Plan 02 Artifacts (GRID-01 through GRID-05)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/app/(dashboard)/sites/page.tsx` | sm:grid-cols-2 on main card grid | ✓ VERIFIED | Line 941: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6` |
| `apps/frontend/src/app/(dashboard)/partners/page.tsx` | sm:grid-cols-2 on main card grid | ✓ VERIFIED | Line 504: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` |
| `apps/frontend/src/app/(dashboard)/financiers/page.tsx` | sm:grid-cols-2 on main card grid | ✓ VERIFIED | Line 1072: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` |
| `apps/frontend/src/app/(dashboard)/external-parties/page.tsx` | sm:grid-cols-2 on main card grid | ✓ VERIFIED | Line 268: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |

---

## Key Link Verification

### Plan 03 Key Links (Gap Closure — TABL-02 and TABL-03)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `-mx-3 sm:mx-0` wrapper div | Layout container `px-3` | Negative margin offsets page container padding; Card extends to viewport edges on mobile | ✓ WIRED | Layout container confirmed at `apps/frontend/src/app/(dashboard)/layout.tsx` line 79: `px-3 py-1 sm:py-6 lg:px-8 lg:py-8`. All four -mx-3 wrappers confirmed adjacent to their Cards. sm:mx-0 restores normal position at 640px+ |
| `whitespace-nowrap` on td/th | `overflow-x-auto` on table wrapper | Nowrap forces single-line content; combined with overflow-x-auto this ensures scroll engagement instead of text wrapping | ✓ WIRED | All four files: overflow-x-auto wrapper confirmed present, whitespace-nowrap confirmed on th/td cells within those tables |
| External-parties conditional render | `-mx-3 sm:mx-0` wrapper closes before `)}` | Wrapper div properly nested inside `{viewMode !== "ledger" && (` | ✓ WIRED | Lines 782-893: `{viewMode !== "ledger" && (` → `<div className="-mx-3 sm:mx-0">` → `<Card>` → ... → `</Card>` → `</div>` → `)}` |

### Plan 01 and Plan 02 Key Links (Unchanged — Verified in Initial Pass)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `financiers/[id]/page.tsx` | Card scroll containers | `overflow-x-auto` inside `overflow-y-auto`; `min-w-[560px]` on table | ✓ WIRED | Line 313: outer overflow-y-auto; line 314: inner overflow-x-auto; line 315: min-w-[560px] |
| `organization/personnel/page.tsx` | `hidden sm:block` desktop table | `overflow-x-auto` on wrapper div | ✓ WIRED | Line 522: `hidden sm:block overflow-x-auto` |
| All four list pages | Tailwind sm: breakpoint (640px) | `sm:grid-cols-2` on grid containers | ✓ WIRED | Confirmed in all four files |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TABL-01 | 02-01-PLAN | All table elements must be inside overflow-x-auto wrappers | ✓ SATISFIED | financiers/[id] and personnel now have wrappers; 5 pre-existing tables confirmed still present |
| TABL-02 | 02-01-PLAN / 02-03-PLAN | Table wrappers use -mx-3 sm:mx-0 for edge-to-edge mobile scroll | ✓ SATISFIED | 4 occurrences confirmed: daily line 366, monthly line 309, reconciliation line 224, external-parties line 783. financiers/[id] and personnel correctly excluded per structural rationale |
| TABL-03 | 02-01-PLAN / 02-03-PLAN | Table cells use whitespace-nowrap to prevent content wrapping | ✓ SATISFIED | financiers/[id]: 36, daily: 9, monthly: 27, external-parties/[id]: 15. reconciliation excluded (no table elements — uses div-based flex layout with font-amount nowrap) |
| GRID-01 | 02-02-PLAN | Dashboard cards use grid-cols-1 sm:grid-cols-2 lg:grid-cols-3+ responsive grid | ? NEEDS HUMAN | Dashboard uses `grid-cols-1 lg:grid-cols-12` two-region layout. Sites page header stats satisfies the spirit of GRID-01 for entity list contexts. Visual confirmation at 375px needed. |
| GRID-02 | 02-02-PLAN | Site list cards: single column mobile, two column tablet | ✓ SATISFIED | `grid-cols-1 sm:grid-cols-2` at sites/page.tsx line 941 |
| GRID-03 | 02-02-PLAN | Partner list cards: single column mobile, two column tablet | ✓ SATISFIED | `grid gap-6 sm:grid-cols-2` at partners/page.tsx line 504 (grid default = 1 column) |
| GRID-04 | 02-02-PLAN | Financier list cards: single column mobile, two column tablet | ✓ SATISFIED | `grid gap-6 sm:grid-cols-2` at financiers/page.tsx line 1072 |
| GRID-05 | 02-02-PLAN | External-party list cards: responsive grid | ✓ SATISFIED | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` at external-parties/page.tsx line 268 |

**Requirements coverage:** 7/8 satisfied automatically, 1 (GRID-01) needs human visual check. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `organization/personnel/page.tsx` | 638-834 | `placeholder=` on input elements | Info | HTML input placeholders, not code stubs. Not a concern. |
| `sites/page.tsx` | 416-919 | `placeholder=` on input elements | Info | HTML input placeholders, not code stubs. Not a concern. |
| `reports/kasa-raporu/page.tsx` | — | Pre-existing TypeScript errors (`useKasaRaporu`, `KasaRaporuRow` not exported from `use-api`) | Warning | Pre-dates Phase 2. Does not affect Phase 2 correctness. |

No empty implementations, return null stubs, or TODO/FIXME comments found in any Phase 2 modified file.

---

## Regression Verification

| File | Expected State | Actual State | Result |
|------|---------------|-------------|--------|
| `reports/daily/page.tsx` | overflow-x-auto preserved | Lines 376-377: two overflow-x-auto divs present | PASS |
| `reports/monthly/page.tsx` | overflow-x-auto preserved | Lines 312-313: two overflow-x-auto divs present | PASS |
| `reports/kasa-raporu/page.tsx` | overflow-x-auto preserved | Line 157: overflow-x-auto present | PASS |
| `reports/reconciliation/page.tsx` | overflow-x-auto preserved | Line 231: overflow-x-auto present | PASS |
| `external-parties/[id]/page.tsx` | overflow-x-auto preserved | Line 785: overflow-x-auto present | PASS |
| `financiers/[id]/page.tsx` | overflow-x-auto and min-w-[560px] preserved | Lines 314-315: both confirmed | PASS |
| `sites/[id]/page.tsx` | table-fixed preserved (approved design) | Line 307: `<table className="w-full table-fixed">` | PASS |
| `partners/[id]/page.tsx` | table-fixed preserved (approved design) | Line 262: `<table className="w-full table-fixed">` | PASS |
| `financiers/[id]/page.tsx` | No -mx-3 sm:mx-0 (excluded per plan) | 0 occurrences confirmed | PASS |
| `organization/personnel/page.tsx` | No -mx-3 sm:mx-0 (excluded per plan) | 0 occurrences confirmed | PASS |
| `reports/reconciliation/page.tsx` | No whitespace-nowrap on cells (no table elements) | 0 occurrences confirmed | PASS |

---

## Git Commits Verified

All commits for Phase 2 exist in the repository:

| Commit | Plan | Description |
|--------|------|-------------|
| `fb6373e` | 02-01 | feat(02-01): add horizontal scroll wrapper to financier detail table |
| `6dc4cdc` | 02-01 | feat(02-01): add horizontal scroll wrapper to personnel desktop table |
| `e96912b` | 02-02 | feat(02-02): fix sites and partners list page grid breakpoints |
| `b0b611f` | 02-02 | feat(02-02): fix financiers and external-parties list page grid breakpoints |
| `2eb78aa` | 02-03 | feat(02-03): add -mx-3 sm:mx-0 edge-to-edge table Card wrappers |
| `e1202bf` | 02-03 | feat(02-03): add whitespace-nowrap to table cells on four pages |

---

## Human Verification Required

### 1. Financier Detail Table Horizontal Scroll at 375px

**Test:** Open `/financiers/[id]` in browser DevTools at 375px width. Navigate to the transaction detail table.
**Expected:** Table container shows a horizontal scrollbar; swiping/scrolling left reveals all 9 columns (TARİH, YAT., ÇEKİM, ÖDEME, TAK., TES., T.KOM., KOM., BAKİYE) without any column being clipped or hidden.
**Why human:** `overflow-x-auto` + `min-w-[560px]` + `whitespace-nowrap` on cells are all in place, but actual scroll engagement at 375px requires visual confirmation.

### 2. Financier Detail Table Sticky Header and Footer

**Test:** On the same page with many rows (load a year with 365 days), scroll vertically through the table.
**Expected:** The column header row stays pinned to the top of the table viewport. The totals row (tfoot) stays pinned to the bottom. Both remain visible while scrolling.
**Why human:** `sticky top-0` and `sticky bottom-0` are inside an `overflow-x-auto` div which is itself inside `overflow-y-auto`. Nested scroll containers can cause `position: sticky` to not engage in Safari because the sticky element's scroll parent must be the overflowing ancestor.

### 3. Dashboard GRID-01 at 375px

**Test:** Open the main dashboard at 375px viewport width.
**Expected:** No content overflow, no horizontal scrollbar on the page body. Summary stat cards are readable.
**Why human:** Dashboard uses `grid-cols-1 lg:grid-cols-12` two-region layout. Whether the overview itself meets the spirit of "1 column on mobile" needs visual confirmation.

### 4. Edge-to-Edge Card Appearance on Mobile

**Test:** Open `/reports/daily`, `/reports/monthly`, `/reports/reconciliation`, and `/external-parties/[id]` at 375px viewport width. Then resize to 640px.
**Expected:** At 375px — the table Card extends flush to viewport left and right edges (no side padding around the Card). At 640px+ — the Card has normal rounded-corner appearance with spacing restored.
**Why human:** The `-mx-3 sm:mx-0` pattern offsets the layout container's `px-3` padding. Visual confirmation that the Card truly reaches the viewport edges at mobile and correctly re-insets at tablet breakpoint is needed.

---

## Gaps Summary

No automated gaps remain. Both gaps from the initial verification — TABL-02 and TABL-03 — are now closed by plan 02-03.

- **TABL-02 closed:** 4 files have `-mx-3 sm:mx-0` wrappers. 2 files (financiers/[id] and personnel) remain correctly excluded per structural rationale (CardContent p-0 and hidden sm:block pattern respectively).
- **TABL-03 closed:** 4 files have `whitespace-nowrap` on th/td cells (36, 9, 27, 15 occurrences respectively). 1 file (reconciliation) remains correctly excluded (no table/th/td elements — uses div-based layout with font-amount providing nowrap via globals.css).

The phase is ready for human visual testing.

---

_Verified: 2026-02-28T23:10:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — initial gaps_found (6/8) → human_needed (8/8 automated)_
