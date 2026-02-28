# Phase 2: Tables and Grids - Research

**Researched:** 2026-02-28
**Domain:** Tailwind CSS responsive tables and card grids (Next.js 15 / Tailwind CSS 3.4.1)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Do NOT redesign from scratch — improve existing code
- Only fix pages/components that are actually broken or not mobile-friendly
- If a table or grid already works well on mobile, leave it alone
- Incremental fixes, not a UI overhaul
- Current site detail (sites/[id]) and partner detail (partners/[id]) table design is approved as-is — horizontal scroll works, alternating row colors good
- shadcn Table component already wraps in `overflow-auto` — leverage this
- Add `whitespace-nowrap` to cells where content wrapping breaks readability
- Wrap tables in `-mx-3 sm:mx-0` negative margin containers for edge-to-edge mobile scroll where needed
- Dashboard summary cards and list page card grids: inspect current code, fix only what's broken at 375px
- Don't enforce rigid breakpoint rules if existing responsive behavior already works
- Success criteria targets: 1 col at 375px, 2 col at 640px, 3+ at 1024px for dashboard; 1 card/row at 375px, 2 at 768px for list pages — but only adjust pages that don't meet this

### Claude's Discretion

- Color choices for any new visual elements (scroll indicators, etc.)
- Which specific tables need `whitespace-nowrap` vs which already work
- Exact padding/margin adjustments per page
- Whether to add visual scroll hints (gradient fade) or rely on native scroll
- Sticky first column: decide per table based on column count and importance

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TABL-01 | All table elements must be inside overflow-x-auto wrappers (~15 tables) | Audit shows which tables already have wrappers vs missing them; shadcn Table has `overflow-auto` built-in but raw `<table>` tags need explicit wrappers |
| TABL-02 | Table wrappers must use `-mx-3 sm:mx-0` to provide edge-to-edge scroll area on mobile | Pattern confirmed; adds full-bleed scroll to tables inside padded page containers |
| TABL-03 | Table cells must use `whitespace-nowrap` to prevent content wrapping | Raw `<td>` cells in raw tables need this; shadcn TableCell does not add it automatically |
| GRID-01 | Dashboard cards must use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3+` responsive grid | Dashboard uses `grid-cols-1 lg:grid-cols-12` two-column layout — no small summary card row; this requirement maps to the sites header stats grid at `grid-cols-2 md:grid-cols-2 lg:grid-cols-4` which misses `sm:` |
| GRID-02 | Sites list card grid: single column mobile, two columns tablet | Currently `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` — misses `sm:grid-cols-2` breakpoint, jumps from 1-col straight to `md:` (768px) |
| GRID-03 | Partners list card grid: single column mobile, two columns tablet | Currently `md:grid-cols-2 lg:grid-cols-3` — same gap: no `sm:` breakpoint |
| GRID-04 | Financiers list card grid: single column mobile, two columns tablet | Currently `md:grid-cols-2 lg:grid-cols-3` — same gap: no `sm:` breakpoint |
| GRID-05 | External-parties list card grid: responsive grid on mobile | Currently `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — same gap: no `sm:` breakpoint |
</phase_requirements>

---

## Summary

Phase 2 is a targeted audit-and-fix phase. The codebase has two classes of problems: table scroll wrapping and grid breakpoint gaps. Both are purely CSS/Tailwind issues requiring no logic changes, no new dependencies, and no architectural restructuring.

**Tables:** The project uses two kinds of table markup. Some pages use the shadcn `Table` component (which already has `overflow-auto` on its wrapper div) — these need a `-mx-3 sm:mx-0` container added outside them and `whitespace-nowrap` on cells where text wraps. Other pages use raw `<table>` tags directly — these need an explicit `overflow-x-auto -mx-3 sm:mx-0` wrapper div added around them. The transactions page uses `table-fixed` which constrains columns and can cause content clipping on mobile; it needs to change to scroll-based behavior instead.

**Grids:** All four list pages (sites, partners, financiers, external-parties) use `md:grid-cols-2` as their first responsive breakpoint (768px), which means screens between 375px and 767px show a single column with very large cards. The target is `sm:grid-cols-2` (640px) as the two-column breakpoint. Dashboard does not have a traditional summary card row — it uses a 12-column hero layout. The sites header stats use `grid-cols-2 md:grid-cols-2 lg:grid-cols-4` which is already two columns on mobile.

**Primary recommendation:** For tables without wrappers, add `<div className="overflow-x-auto -mx-3 sm:mx-0">` around the table. For cells, add `whitespace-nowrap` class. For grids, change `md:grid-cols-2` to `sm:grid-cols-2` across the four list pages. No new libraries needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.1 (project) | All responsive classes used in this phase | Already installed; utility-first approach means zero runtime cost |
| shadcn/ui Table | Built-in (project) | Base table component with `overflow-auto` wrapper | Already the project's table abstraction |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | Phase requires no new libraries | All fixes are Tailwind class changes only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `overflow-x-auto` wrapper | CSS `overflow: auto` inline style | Tailwind class is preferred in this codebase; no reason to inline |
| `-mx-3 sm:mx-0` negative margin | Container with `px-0` | Negative margin is simpler when outer container has fixed padding |
| `whitespace-nowrap` on cells | `min-width` on columns | `whitespace-nowrap` is simpler and requires no measurement |

**Installation:** None required. All tools already present.

---

## Architecture Patterns

### Per-Table Classification (What to Fix vs Skip)

Based on direct code audit:

#### Tables that already have `overflow-x-auto` wrappers — VERIFY then SKIP if working:
- `reports/kasa-raporu/page.tsx` — has `overflow-x-auto` + sticky first column (`whitespace-nowrap` present)
- `reports/daily/page.tsx` — has `overflow-x-auto` (double-wrapped, but functional)
- `reports/monthly/page.tsx` — has `overflow-x-auto` (double-wrapped)
- `reports/reconciliation/page.tsx` — has `overflow-x-auto`
- `external-parties/[id]/page.tsx` — has `overflow-x-auto`

#### Tables that NEED scroll wrapper + whitespace-nowrap (raw `<table>` tags, no overflow wrapper):
- `financiers/[id]/page.tsx` — 9-column `<table>` with `table-fixed`, inside `max-h-[65vh] overflow-y-auto` container but NO horizontal overflow wrapper; cells have `px-0.5` (very tight) with `text-[9px]` mobile text scaling — at 375px columns almost certainly clip
- `transactions/page.tsx` — raw `<table>` with `table-fixed sm:table-auto`; columns use `hidden sm:` / `hidden md:` / `hidden xl:` to progressively show; the Card wraps with `overflow-hidden` which clips scroll — needs `overflow-x-auto` on the Card or inner div
- `organization/personnel/page.tsx` — has "Desktop Table" (`hidden sm:block`) with mobile card fallback; the desktop table has no scroll wrapper on the outer `div.bg-white.rounded-xl`

#### Tables that are approved as-is (do NOT touch):
- `sites/[id]/page.tsx` — `table-fixed` in a scrollable area; approved design
- `partners/[id]/page.tsx` — `table-fixed` in a scrollable area; approved design

#### EditableTransactionGrid — SCOPE DECISION NEEDED:
- `components/bulk-import/EditableTransactionGrid.tsx` — uses `hidden md:block` for the desktop table (so mobile never sees it, mobile gets a card view). The table itself has `overflow-auto` on its wrapper. No action needed.

### Per-Grid Classification (What to Fix vs Skip)

#### Grids that need breakpoint fix:
- `sites/page.tsx` line 941: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` → change to `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`
- `partners/page.tsx` line 504: `gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3` → change to `gap-6 sm:grid-cols-2 lg:grid-cols-3`
- `financiers/page.tsx` line 1072: `gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3` → change to `gap-6 sm:grid-cols-2 lg:grid-cols-3`
- `external-parties/page.tsx` line 268: `gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` → change to `gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

#### Grids that are already fine or not in scope:
- Dashboard (`grid-cols-1 lg:grid-cols-12`): this is the overall two-column layout — not a summary stat card row. No change needed.
- Sites page header stats (`grid-cols-2 md:grid-cols-2 lg:grid-cols-4`): already 2-column on mobile (375px). Satisfies GRID-01 in context of the sites header. No change needed.
- Sites page sub-grids (e.g. `grid-cols-3`, `grid-cols-2`) inside modals: these are form layouts, not card grids. Out of scope.

### Pattern 1: Adding scroll wrapper to a raw table

**What:** Wraps raw `<table>` in an `overflow-x-auto` div with negative margin trick for full-bleed mobile scrolling
**When to use:** Any `<table>` that is NOT already wrapped in `overflow-x-auto`, inside a padded page container

```tsx
{/* Before: table clips at container boundary */}
<div className="...">
  <table className="w-full table-fixed">...</table>
</div>

{/* After: table scrolls horizontally */}
<div className="-mx-3 sm:mx-0 overflow-x-auto">
  <div className="min-w-0 px-3 sm:px-0">
    <table className="w-full min-w-[640px]">...</table>
  </div>
</div>
```

Note: `min-w-[640px]` (or specific value) forces the table to its natural minimum width so scroll can engage. Without it, a table with `w-full` may still shrink to fit.

### Pattern 2: `whitespace-nowrap` on table cells

**What:** Prevents text from wrapping inside table cells, keeping each row on one line
**When to use:** Any `<td>` or `<th>` containing financial numbers, dates, or short labels that should not wrap

```tsx
{/* Financial number cells */}
<td className="px-3 py-2 font-mono text-right whitespace-nowrap">
  {formatMoney(value)}
</td>

{/* Date cells */}
<td className="px-3 py-2 whitespace-nowrap">
  {formatTurkeyDate(date)}
</td>
```

### Pattern 3: Fixing list page card grid breakpoints

**What:** Adding `sm:grid-cols-2` so two-column layout kicks in at 640px instead of 768px
**When to use:** All four list pages

```tsx
{/* Before: single column until 768px */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

{/* After: two columns from 640px */}
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
```

### Pattern 4: transactions/page.tsx — scroll approach for a table-fixed table

The transactions table has `table-fixed sm:table-auto` and uses `hidden sm:table-cell` / `hidden md:table-cell` column hiding. The outer Card has `overflow-hidden` which blocks scroll. Two valid approaches:

**Option A (preferred — simpler):** Remove `table-fixed` on mobile, add `overflow-x-auto` wrapper, add `whitespace-nowrap` on cells. The column hiding (`hidden sm:table-cell`) remains for progressive enhancement.

```tsx
{/* Outer Card: change overflow-hidden → overflow-visible or remove */}
<Card className="border-0 shadow-xl ... rounded-3xl">  {/* remove overflow-hidden */}
  <div className="-mx-3 sm:mx-0 overflow-x-auto">
    <table className="w-full sm:table-auto min-w-[400px]">
      {/* cells with whitespace-nowrap */}
    </table>
  </div>
</Card>
```

**Option B (keep column hiding as primary strategy):** The current column-hiding approach already reduces columns on mobile significantly (only 5-6 columns visible at xs). If at 375px the visible columns fit without scroll, this already works. Audit actual render before touching.

### Anti-Patterns to Avoid

- **Removing `table-fixed` without setting a `min-w`:** Without `table-fixed`, a `w-full` table will shrink to fit available width. Add `min-w-[Xpx]` to force natural minimum so the scroll container can actually scroll.
- **Wrapping shadcn Table with another `overflow-x-auto`:** The shadcn `Table` already has `overflow-auto` on its wrapper div. Adding another wrapper creates double nesting which can cause z-index issues with sticky headers. Instead add `-mx-3 sm:mx-0` to the existing shadcn Table's container parent.
- **Adding `overflow-x-auto` to a container that has `overflow-hidden`:** If a Card or parent already has `overflow-hidden`, the scroll will be clipped. Remove `overflow-hidden` or move it inward.
- **Changing `lg:grid-cols-3` when the goal is only to fix `md:grid-cols-2`:** Only touch the breakpoint that needs fixing. Don't adjust the higher breakpoints unnecessarily.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll indicator (fade) | Custom JS scroll-position tracker | CSS `mask-image: linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)` on the wrapper | Pure CSS, no JS, no ResizeObserver needed |
| Column prioritization | Custom visibility logic | Existing `hidden sm:table-cell` / `hidden md:table-cell` pattern already in codebase | Already implemented in transactions table; don't replace |
| Sticky first column | Complex JS sticky logic | `position: sticky; left: 0; z-index: 10` (CSS only) — already done in kasa-raporu | Already present as a model |

**Key insight:** Every problem in this phase is solvable with Tailwind utility classes. No JavaScript, no new React state, no new components.

---

## Common Pitfalls

### Pitfall 1: `overflow-hidden` on parent blocking scroll

**What goes wrong:** Table gets `overflow-x-auto` wrapper but scroll still doesn't work. The table appears stuck.
**Why it happens:** An ancestor element has `overflow-hidden` (often a Card with `rounded-*xl overflow-hidden` for clipping rounded corners). The `overflow-hidden` prevents the `overflow-x-auto` scroll from propagating.
**How to avoid:** When adding scroll to a table, scan upward in JSX to find any `overflow-hidden` on ancestors. Options: (a) move `overflow-hidden` to a smaller inner element, (b) apply `overflow-hidden` only to the non-table parts.
**Warning signs:** `overflow-x-auto` wrapper added but page still doesn't scroll horizontally on mobile.

Concrete case in this project: `transactions/page.tsx` — the Card wrapper has `overflow-hidden` at line 906. The inner table's scroll wrapper will be blocked by it.

### Pitfall 2: `table-fixed` defeating scroll intent

**What goes wrong:** Table has `overflow-x-auto` but columns still crush at small widths because `table-fixed` forces each column to share available width equally.
**Why it happens:** `table-fixed` ignores content size and distributes width based on explicit widths or equal fractions. Columns with explicit `w-[Xpx]` may overflow the row; columns without explicit widths squeeze to near-zero.
**How to avoid:** Either (a) switch to `table-auto` (or remove `table-fixed`) and add a `min-w-[Xpx]` on the table itself, or (b) ensure every column has an explicit `w-` value that sums to more than 375px so scroll engages.
**Warning signs:** Table cells clip text even though `overflow-x-auto` is present.

Concrete cases: `financiers/[id]/page.tsx` (9-column `table-fixed`) and `transactions/page.tsx` (`table-fixed sm:table-auto`).

### Pitfall 3: Adding `-mx-3 sm:mx-0` inside a Card with `px-6` padding

**What goes wrong:** The negative margin pulls the table to the edge of the viewport but the card content area still has padding, creating misaligned left/right edges.
**Why it happens:** `CardContent` typically has `p-6` or `p-4`. If the table wrapper is inside CardContent, `-mx-3` only offsets the CardContent padding partially.
**How to avoid:** Place the scroll wrapper **outside** `CardContent`, or make the Card use `p-0` and manage internal padding separately for non-table content.
**Warning signs:** Table scrolls but has asymmetric margins at the edges.

### Pitfall 4: `whitespace-nowrap` on cells with description text

**What goes wrong:** Description columns become very wide, making the table scroll excessively.
**Why it happens:** `whitespace-nowrap` prevents line breaks, so long descriptions push the table to hundreds of pixels wide.
**How to avoid:** Apply `whitespace-nowrap` only to number, date, badge, and short-label cells. For description/note cells, use `max-w-[Xpx] truncate` instead.
**Warning signs:** Table scroll area is unexpectedly very long (> 800px) after applying `whitespace-nowrap`.

### Pitfall 5: Double `overflow-x-auto` wrapping

**What goes wrong:** `reports/daily` and `reports/monthly` already have double `overflow-x-auto` nesting (two nested divs both with this class). This is wasteful but not broken. Adding a third layer would be wrong.
**Why it happens:** Multiple developers added wrappers at different times.
**How to avoid:** When auditing each table, check ONE level up AND two levels up for existing overflow classes before adding. Remove duplicate wrappers if found.

---

## Code Examples

Verified from codebase inspection:

### Already Working: kasa-raporu sticky first column + overflow-x-auto

```tsx
// Source: reports/kasa-raporu/page.tsx line 157
<div className="overflow-x-auto">
  <table>
    <tbody>
      <td className="sticky left-0 z-10 bg-inherit px-2 sm:px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">
        {/* row label */}
      </td>
    </tbody>
  </table>
</div>
```
This is the reference pattern for sticky first column in this project.

### Already Working: partners/[id] and sites/[id] approved table design

```tsx
// Source: partners/[id]/page.tsx line 261-262
<div className="max-h-[65vh] overflow-y-auto">
  <table className="w-full table-fixed">
    <thead className="sticky top-0 z-10 ...">
      <tr>
        <th className="w-[40px] sm:w-[80px] px-1.5 sm:px-4 ...">TARİH</th>
        {/* ... */}
      </tr>
    </thead>
  </table>
</div>
```
The partner/site detail tables are `table-fixed` with tiny mobile text (`text-[9px]`) and compressed column widths — they fit within 375px. This is the approved approach: don't add horizontal scroll here, they already fit.

### Needs Fix: financiers/[id] 9-column table

```tsx
// Source: financiers/[id]/page.tsx line 312-314 (CURRENT — BROKEN)
<CardContent className="p-0">
  <div className="max-h-[65vh] overflow-y-auto">
    <table className="w-full table-fixed">
      <thead>
        <tr>
          <th className="w-[28px] sm:w-[70px] ...">{/* TARİH */}</th>
          <th className="...">{/* YAT. */}</th>
          {/* 9 columns total */}
        </tr>
      </thead>
    </table>
  </div>
</CardContent>

// FIX: wrap with horizontal scroll
<CardContent className="p-0">
  <div className="max-h-[65vh] overflow-y-auto">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">  {/* remove table-fixed, add min-w */}
        {/* ... */}
      </table>
    </div>
  </div>
</CardContent>
```

### Needs Fix: list page grids

```tsx
// Source: partners/page.tsx line 504 (CURRENT)
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">

// FIX: add sm: breakpoint
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

// Source: external-parties/page.tsx line 268 (CURRENT)
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// FIX:
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `overflow-x: scroll` always | `overflow-x: auto` (scroll only when needed) | Standard for years | No persistent scrollbar on desktop |
| `display: block` on `<table>` for mobile | Horizontal scroll with `overflow-x-auto` wrapper | Current best practice | Preserves table semantics, screen reader compatibility |
| Card-view transform (table to cards on mobile) | Keep table + scroll wrapper | Project decision (Out of Scope) | Simpler, no dual rendering path |

**Deprecated/outdated:**
- `overflow-x: scroll` (always shows scrollbar): Use `overflow-x: auto` instead — scrollbar only appears when content overflows.
- `table-fixed` without explicit column widths: Without explicit widths, `table-fixed` distributes width equally which crushes mobile columns.

---

## Open Questions

1. **transactions/page.tsx table: column-hiding vs scroll**
   - What we know: The table uses `hidden sm:table-cell`, `hidden md:table-cell`, `hidden xl:table-cell` — on a 375px screen only 6-7 columns are visible (Islem, Site, Finansor, Tarih, Tutar, and the action column)
   - What's unclear: Whether those 6-7 columns at their current widths (`w-[72px]`, `w-[60px]`, `w-[60px]`, `w-[50px]`) actually fit within 375px − sidebar width without wrapping
   - Recommendation: This table is in Phase 4 scope (TXNP-01), not Phase 2. Phase 2 should NOT modify transactions/page.tsx. Confirm with user that this is deferred.

2. **organization/personnel/page.tsx: mobile card fallback**
   - What we know: The personnel table has `hidden sm:block` (desktop only) with a `sm:hidden` mobile card list below it. The desktop table is never shown on mobile.
   - What's unclear: Whether TABL-01/TABL-02/TABL-03 apply to the personnel desktop table since it's hidden on mobile anyway
   - Recommendation: The desktop table (at sm: and above) should still have `overflow-x-auto` for tablet widths (768px) — add the wrapper. Skip `whitespace-nowrap` fix since mobile already has card fallback.

3. **GRID-01 mapping to dashboard**
   - What we know: The dashboard has `grid-cols-1 lg:grid-cols-12` as its main layout. There are no summary "stat cards" in a 3-4 card grid row.
   - What's unclear: GRID-01 says "Dashboard kartlari grid-cols-1 sm:grid-cols-2 lg:grid-cols-3+". The only candidate is the sites header stat strip (`grid-cols-2 md:grid-cols-2 lg:grid-cols-4`) — but this is inside sites/page.tsx, not the dashboard page.
   - Recommendation: Interpret GRID-01 as applying to the sites/page.tsx header stats strip (already 2-col on mobile — passes) AND any future dashboard summary cards. Current dashboard passes GRID-01 because it uses a list-based layout (not a crushed card grid). Mark GRID-01 as satisfied by inspection.

---

## Per-File Action Map

This section gives the planner precise file-by-file actions:

### Plan 02-01: Tables

| File | Current State | Required Action | Complexity |
|------|--------------|-----------------|------------|
| `financiers/[id]/page.tsx` | 9-col `table-fixed`, no horizontal scroll | Add `overflow-x-auto` wrapper inside `overflow-y-auto` container; change to `table-auto` or set `min-w-[560px]`; add `whitespace-nowrap` on numeric cells | Low |
| `organization/personnel/page.tsx` | Desktop table has no overflow wrapper | Add `overflow-x-auto` around the `hidden sm:block` table div | Low |
| `reports/daily/page.tsx` | Already has `overflow-x-auto` (double) | Verify works; if double-wrapped, remove inner duplicate | Verify only |
| `reports/monthly/page.tsx` | Already has `overflow-x-auto` (double) | Verify works; clean up duplicate if present | Verify only |
| `reports/kasa-raporu/page.tsx` | Already has `overflow-x-auto` + sticky col | Verify works at 375px | Verify only |
| `reports/reconciliation/page.tsx` | Already has `overflow-x-auto` | Verify works at 375px | Verify only |
| `external-parties/[id]/page.tsx` | Already has `overflow-x-auto` | Verify works; cells have `px-6 py-4` (large) — may need `whitespace-nowrap` | Verify + maybe cells |
| `sites/[id]/page.tsx` | Approved — `table-fixed` with tiny mobile text | Leave untouched | None |
| `partners/[id]/page.tsx` | Approved — `table-fixed` with tiny mobile text | Leave untouched | None |
| `transactions/page.tsx` | `table-fixed sm:table-auto` + `overflow-hidden` on Card | DEFER to Phase 4 (TXNP-01) | Phase 4 |
| `bulk-import/EditableTransactionGrid.tsx` | `hidden md:block` (mobile gets card view) | No action needed | None |

### Plan 02-02: Grids

| File | Current Grid | Fixed Grid | Line |
|------|-------------|------------|------|
| `sites/page.tsx` | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` | 941 |
| `partners/page.tsx` | `grid gap-6 md:grid-cols-2 lg:grid-cols-3` | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` | 504 |
| `financiers/page.tsx` | `grid gap-6 md:grid-cols-2 lg:grid-cols-3` | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` | 1072 |
| `external-parties/page.tsx` | `grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | 268 |

---

## Sources

### Primary (HIGH confidence)

- Direct codebase audit — `apps/frontend/src/app/(dashboard)/` and `apps/frontend/src/components/` — read 15+ files, extracted exact class strings and line numbers
- `apps/frontend/src/components/ui/table.tsx` — confirmed shadcn Table wraps in `overflow-auto` at line 9
- `apps/frontend/.planning/phases/02-tables-and-grids/02-CONTEXT.md` — user decisions confirmed

### Secondary (MEDIUM confidence)

- Tailwind CSS 3.x docs (via training knowledge): `overflow-x-auto`, `whitespace-nowrap`, `grid-cols-*`, `sm:` breakpoint = 640px, `md:` = 768px — these are stable, unchanged since Tailwind v2

### Tertiary (LOW confidence)

- None — no unverified web search claims in this research

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all tools verified in package.json
- Architecture: HIGH — patterns derived from direct code reading, not assumptions
- Pitfalls: HIGH — each pitfall traces to specific code in the codebase (not generic advice)
- Per-file action map: HIGH — line numbers verified against actual file contents

**Research date:** 2026-02-28
**Valid until:** Stable (Tailwind 3.4.x CSS behavior won't change)
