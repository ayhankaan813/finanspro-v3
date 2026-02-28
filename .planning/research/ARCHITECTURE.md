# Architecture Research

**Domain:** Responsive retrofitting — Next.js 15 App Router dashboard with Tailwind CSS 3.4.1 + shadcn/ui
**Researched:** 2026-02-28
**Confidence:** HIGH (based on direct codebase analysis + established Tailwind/Next.js patterns)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DashboardLayout (layout.tsx)                      │
│   Sidebar (fixed, lg:block) + MobileHeader (sticky, lg:hidden)      │
│   <main className="lg:pl-64">                                        │
│     <div className="container px-3 py-1 sm:py-6 lg:px-8 lg:py-8">  │
├─────────────────────────────────────────────────────────────────────┤
│                    Page Components (21 pages)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Dashboard│  │ Sites/   │  │ Reports  │  │ Txns/    │            │
│  │ (done)   │  │ Partners │  │ (partial)│  │ Approvals│            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
├─────────────────────────────────────────────────────────────────────┤
│                    Shared UI Primitives (shadcn/ui)                  │
│  Card  Table  Dialog  Sheet  Tabs  Badge  Button  Skeleton           │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Responsive State by Page

| Page | Path | Responsive State | Primary Issues |
|------|------|-----------------|----------------|
| Dashboard | `/dashboard` | DONE | None — uses sm:/lg: throughout |
| Kasa Raporu | `/reports/kasa-raporu` | DONE | `overflow-x-auto` on table |
| Mutabakat | `/reports/reconciliation` | DONE | `overflow-x-auto` on table |
| Analiz | `/reports/analysis` | DONE | Dark mode responsive header |
| Settings | `/settings` | DONE | Tabs + responsive grid |
| Approvals | `/approvals` | PARTIAL | Header `text-3xl` not scaled, cards not full-mobile |
| Sites List | `/sites` | PARTIAL | Card grid ok but dialogs unscaled |
| Partners List | `/partners` | PARTIAL | Similar to sites |
| Financiers List | `/financiers` | PARTIAL | Similar |
| Sites [id] | `/sites/[id]` | PARTIAL | Stats grid `grid-cols-4` breaks at 375px |
| Partners [id] | `/partners/[id]` | MINIMAL | `table-fixed` with no `overflow-x-auto` wrapper |
| Financiers [id] | `/financiers/[id]` | MINIMAL | Same issue as partners [id] |
| Organization | `/organization` | MINIMAL | No sm: breakpoints in main layout |
| Org/Personnel | `/organization/personnel` | MINIMAL | Raw `<table>` without scroll wrapper |
| Org/Site-Profit | `/organization/site-profitability` | MINIMAL | Minimal responsive |
| External Parties | `/external-parties` | MINIMAL | Some overflow-x-auto, incomplete |
| External [id] | `/external-parties/[id]` | PARTIAL | Has `overflow-x-auto` on table |
| Transactions | `/transactions` | PARTIAL | `table-fixed sm:table-auto` but no scroll wrapper |
| Txns/Import | `/transactions/import` | MINIMAL | Unknown, needs audit |
| Reports/Daily | `/reports/daily` | PARTIAL | `hidden sm:table` pattern, needs mobile card view |
| Reports/Monthly | `/reports/monthly` | PARTIAL | `hidden sm:table`, same issue |

### Component Responsibilities

| Component | Responsibility | Current Responsive Status |
|-----------|----------------|--------------------------|
| `layout.tsx` | Sidebar offset (`lg:pl-64`), container padding | DONE — foundation is solid |
| `sidebar.tsx` | Mobile Sheet drawer + Desktop fixed sidebar | DONE — hamburger works |
| `NotificationBell` | Desktop-only (`hidden lg:flex`) | DONE |
| `TransactionFilters` | Filter panel for transactions page | NEEDS AUDIT |
| `OverviewChart` | Dashboard chart (Recharts) | DONE — `h-[220px] sm:h-[300px]` |
| `EditableTransactionGrid` | Bulk import grid | NEEDS AUDIT |

---

## Recommended Project Structure

The retrofit does NOT require adding folders. Work within existing structure:

```
apps/frontend/src/
├── app/(dashboard)/
│   ├── layout.tsx              # DONE — do not touch
│   ├── dashboard/page.tsx      # DONE — reference implementation
│   ├── reports/                # PARTIALLY DONE — reference for table pattern
│   │   ├── kasa-raporu/        # DONE — use as table scroll reference
│   │   ├── reconciliation/     # DONE
│   │   ├── analysis/           # DONE
│   │   ├── daily/              # PARTIAL — needs mobile card alternative
│   │   └── monthly/            # PARTIAL — needs mobile card alternative
│   ├── sites/                  # PARTIAL
│   ├── partners/               # PARTIAL / MINIMAL
│   ├── financiers/             # PARTIAL / MINIMAL
│   ├── organization/           # MINIMAL
│   ├── external-parties/       # MINIMAL / PARTIAL
│   ├── transactions/           # PARTIAL
│   ├── approvals/              # PARTIAL
│   └── settings/               # DONE
├── components/
│   ├── layout/                 # DONE — do not touch
│   ├── transactions/
│   │   └── TransactionFilters.tsx  # NEEDS AUDIT
│   └── ui/                     # shadcn/ui — do not modify
└── lib/
    └── utils.ts                # formatMoney, cn — do not touch
```

### Structure Rationale

- **No new folders needed:** All responsive work is Tailwind class additions to existing files.
- **No new packages:** Constraint from PROJECT.md — only Tailwind classes.
- **Reference files:** `dashboard/page.tsx` and `reports/kasa-raporu/page.tsx` are the gold standard — consult before implementing each page.

---

## Architectural Patterns

### Pattern 1: Layout Shell — Already Correct, Do Not Change

**What:** The root layout provides `lg:pl-64` sidebar offset and `container px-3 py-1 sm:py-6 lg:px-8 lg:py-8` padding. This is the correct outer shell.

**When to use:** Already applied. Pages only need inner-content responsive fixes.

**Key insight:** Pages DO NOT need to repeat `px-3` or container logic — they receive it from layout. The page root `<div>` should start with `space-y-4 sm:space-y-6` or `min-h-screen`.

```typescript
// CORRECT — page root, matches dashboard reference
<div className="space-y-4 sm:space-y-6 pb-12">
  ...
</div>

// WRONG — layout already handles this
<div className="p-4 sm:p-6 lg:p-8">
  ...
</div>
```

### Pattern 2: Page Header — Scale Title Font

**What:** Every page header uses a large title (`text-3xl`, `text-2xl`). On mobile 375px, `text-3xl` (30px) causes overflow with action buttons beside it.

**When to use:** Every non-report page that has a `<h1>` title with adjacent buttons.

```typescript
// PATTERN — used in dashboard, reference for all pages
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
  Onay Bekleyenler
</h1>
// Button beside title: add min-w-0 to title container, shrink-0 to buttons
<div className="flex items-center justify-between gap-2 min-w-0">
  <div className="min-w-0">
    <h1 className="text-xl sm:text-2xl font-bold truncate">...</h1>
  </div>
  <Button className="shrink-0">...</Button>
</div>
```

### Pattern 3: Stats Card Grid — Responsive Column Count

**What:** Financial summary cards use `grid-cols-N`. On 375px, anything above `grid-cols-2` causes card content to overflow.

**When to use:** All pages with stat card grids (sites [id] has `grid-cols-4 lg:grid-cols-7`, which breaks at mobile).

```typescript
// SAFE — works from 375px upward
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
  {statCards.map(card => (
    <div className="rounded-xl bg-white p-2 sm:p-3 border shadow-sm">
      <p className="text-xs sm:text-sm font-medium truncate">{card.label}</p>
      <p className="text-sm sm:text-base font-bold font-mono">{formatMoney(card.value)}</p>
    </div>
  ))}
</div>
```

### Pattern 4: Table with Horizontal Scroll Wrapper

**What:** The mandatory pattern for all `<table>` elements. Raw tables without this wrapper break at 375px.

**When to use:** Every `<table>` element in every page. This is the single most impactful fix across the codebase.

**Reference implementation:** `reports/kasa-raporu/page.tsx` line 157.

```typescript
// MANDATORY WRAPPER — apply to ALL tables
<div className="overflow-x-auto -mx-3 sm:mx-0 rounded-xl">
  <table className="w-full text-xs sm:text-sm whitespace-nowrap">
    <thead>
      <tr>
        <th className="sticky left-0 bg-white px-3 py-2">Tarih</th>
        {/* other headers */}
      </tr>
    </thead>
    <tbody>...</tbody>
  </table>
</div>
```

**Key details:**
- `-mx-3 sm:mx-0` extends scroll area edge-to-edge on mobile (compensates for parent container padding).
- `whitespace-nowrap` prevents cell text from wrapping and destroying column widths.
- First column can use `sticky left-0 bg-white z-10` so users keep context while scrolling.

### Pattern 5: Mobile Card Alternative for Dense Tables

**What:** For the daily/monthly report tables that use `hidden sm:table`, a mobile card view needs to be shown on xs screens.

**When to use:** Tables with 6+ columns where scrolling is worse UX than card stacking. Applies to `reports/daily` and `reports/monthly` primarily.

```typescript
// TWO-VIEW PATTERN — table on sm+, cards on mobile
{/* Mobile card view */}
<div className="sm:hidden space-y-2">
  {rows.map(row => (
    <div key={row.id} className="rounded-xl border bg-white p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm">{row.period}</span>
        <span className="font-mono text-sm font-bold">{formatMoney(row.balance)}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Yatırım: {formatMoney(row.deposit)}</span>
        <span>Çekim: {formatMoney(row.withdrawal)}</span>
      </div>
    </div>
  ))}
</div>
{/* Desktop table */}
<div className="hidden sm:block overflow-x-auto">
  <table className="w-full text-sm">...</table>
</div>
```

### Pattern 6: Dialog/Sheet Responsiveness

**What:** Dialogs opened from list pages (create/edit forms) use fixed widths that overflow on mobile.

**When to use:** All `<Dialog>` and `<DialogContent>` in sites, partners, financiers, transactions pages.

```typescript
// CORRECT dialog sizing
<DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
  <div className="space-y-4">
    {/* Form fields stack vertically on mobile */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label>Alan 1</Label><Input /></div>
      <div><Label>Alan 2</Label><Input /></div>
    </div>
  </div>
</DialogContent>
```

### Pattern 7: Financial Number Truncation Prevention

**What:** `formatMoney()` outputs values like "1.234.567,89 TL". On mobile, this must not truncate or break layout. Use `font-mono` and `shrink-0`/`min-w-0` correctly.

**When to use:** Every component that shows a monetary value next to a label.

```typescript
// CORRECT — prevents number from being truncated, label truncates instead
<div className="flex items-center justify-between gap-2">
  <span className="text-sm text-muted-foreground min-w-0 truncate">{label}</span>
  <span className="font-mono text-sm font-bold shrink-0">{formatMoney(value)}</span>
</div>
```

---

## Recommended Build Order

This order is the critical architectural decision. It must be followed:

### Phase 1 — Layout Foundation Audit (1 file, ~30 min)

**Target:** `layout.tsx` only.

**Why first:** Every page inherits from layout. Confirming the foundation is correct eliminates a class of bugs before page work begins. Current state is already correct (`lg:pl-64`, container padding) — this is a verification + minor polish step only.

**Deliverable:** Layout confirmed correct. No visual regressions.

### Phase 2 — Shared Infrastructure: Responsive Utilities

**NOT a new package** — these are conventions written down, not extracted components. Define:

1. **Table scroll wrapper convention** — `<div className="overflow-x-auto -mx-3 sm:mx-0">` wrapping every `<table>`. Document as a comment pattern.
2. **Header pattern** — `text-xl sm:text-2xl font-bold` instead of `text-3xl`. Establish once, apply everywhere.
3. **Financial number pattern** — `font-mono shrink-0` on amounts, `min-w-0 truncate` on labels.
4. **Card grid pattern** — `grid-cols-2 sm:grid-cols-3 lg:grid-cols-N`.

**Why before pages:** Without these conventions, each page gets fixed independently and inconsistently. The patterns become the checklist.

### Phase 3 — Detail Pages (High Traffic, Complex Layout)

Work order within this phase:

| Order | Page | Why This Order |
|-------|------|----------------|
| 1 | `/sites/[id]` | Most complex; `grid-cols-4 lg:grid-cols-7` breaks hardest. Sets pattern for financier/partner detail. |
| 2 | `/financiers/[id]` | Same structure as sites, apply established pattern. |
| 3 | `/partners/[id]` | Same structure again, fast apply. |
| 4 | `/external-parties/[id]` | Different structure but has `overflow-x-auto` already — simpler. |

**All three [id] pages share the same layout template:** hero balance card + stat grid + year/month selector + table. Fix one, have a reference for the other two.

### Phase 4 — List Pages

| Order | Page | Primary Fix |
|-------|------|------------|
| 1 | `/sites` | Card grid already responsive; fix dialog widths + form layout |
| 2 | `/partners` | Same pattern as sites |
| 3 | `/financiers` | Same pattern |
| 4 | `/external-parties` | Simpler list, fix header + card grid |

**Why list pages after detail pages:** Users navigate from list to detail. Fixing detail first means the visible "destination" is polished while we work on the "entry point".

### Phase 5 — High-Complexity Pages

| Order | Page | Primary Challenge |
|-------|------|-------------------|
| 1 | `/transactions` | Largest file; `table-fixed sm:table-auto` needs scroll wrapper + mobile card alternative for transaction rows |
| 2 | `/approvals` | Card-based (easier), but action buttons layout breaks on mobile |
| 3 | `/organization` | Charts + stat cards + transaction list — Recharts needs `<ResponsiveContainer>` check |
| 4 | `/organization/personnel` | Raw `<table>` with no scroll wrapper |
| 5 | `/organization/site-profitability` | Likely similar to personnel |

### Phase 6 — Report Pages Completion

| Order | Page | Gap to Close |
|-------|------|-------------|
| 1 | `/reports/daily` | Add mobile card view for `hidden sm:table` |
| 2 | `/reports/monthly` | Same pattern as daily |

### Phase 7 — Final Audit

Systematically test every page at 375px, 768px, 1024px. Use browser devtools. Fix any remaining overflow or truncation issues found during testing.

---

## Component vs Page Level Changes

This distinction matters for planning parallelism:

### Page-Level Changes Only (No Shared Component Changes)

- All responsive fixes are Tailwind class additions within page files.
- `shadcn/ui` components (`Card`, `Table`, `Dialog`, `Tabs`) are NOT modified — their internal structure is fine; the wrapping/usage in pages is what gets fixed.
- `layout.tsx` and `sidebar.tsx` are NOT modified.
- `use-api.ts` hooks are NOT modified.

### The One Shared Component to Audit

- `TransactionFilters.tsx` — used inside `/transactions/page.tsx`. If it has fixed widths or non-responsive layout, fix it once and both the page and any future consumer benefit.
- `EditableTransactionGrid.tsx` — used in `/transactions/import/page.tsx`. Likely has fixed column widths. Audit required.

---

## Data Flow (Unchanged by Responsive Work)

```
User Action (mobile or desktop)
    |
Page Component (adds/removes CSS classes only)
    |
React Query hooks (use-api.ts) — UNCHANGED
    |
API (backend) — UNCHANGED
```

Responsive retrofitting is **purely presentational**. Zero data flow changes.

---

## Anti-Patterns

### Anti-Pattern 1: Page-Level Container Padding Duplication

**What people do:** Add `p-4 sm:p-6 lg:p-8` to the page root `<div>` because it "looks right" in isolation.

**Why it's wrong:** `layout.tsx` already applies `container px-3 py-1 sm:py-6 lg:px-8 lg:py-8`. Double-applying padding creates inconsistent spacing and breaks the `-mx-3` table scroll trick (the negative margin must cancel the exact container padding).

**Do this instead:** Page root should use `space-y-4 sm:space-y-6` only for vertical rhythm. Never add horizontal padding at the page level.

### Anti-Pattern 2: Hiding Table Columns Instead of Scroll

**What people do:** `<th className="hidden sm:table-cell">` to drop columns on mobile.

**Why it's wrong:** Financial data tables need all columns for the numbers to make sense. Hiding "Komisyon" or "Takviye" on mobile loses critical information. Users prefer scrolling to missing data.

**Do this instead:** `overflow-x-auto` wrapper + `whitespace-nowrap` on the table. Optionally stick the first column (date/name).

### Anti-Pattern 3: `table-fixed` Without Scroll Wrapper

**What people do:** Use `table-fixed` (already present in sites [id], partners [id], financiers [id]) assuming it controls layout.

**Why it's wrong:** `table-fixed` allocates equal column widths — on 375px this makes each column extremely narrow, causing number truncation. Without a scroll wrapper, there's no horizontal escape.

**Do this instead:** Remove `table-fixed`, add `overflow-x-auto` wrapper + `whitespace-nowrap` on cells. Let column widths be content-driven.

### Anti-Pattern 4: `text-3xl` Headers on Mobile

**What people do:** Carry desktop heading sizes without scaling (`<h1 className="text-3xl font-bold">`).

**Why it's wrong:** On 375px, `text-3xl` (30px) plus adjacent buttons causes the flex container to overflow. The Approvals page currently does this.

**Do this instead:** `text-xl sm:text-2xl lg:text-3xl` — scale up from mobile.

### Anti-Pattern 5: Recharts Without `width: "100%"`

**What people do:** Set fixed pixel widths on Recharts containers.

**Why it's wrong:** Charts clip on narrow screens and don't resize on orientation change.

**Do this instead:** Always use `<ResponsiveContainer width="100%" height={220}>` and control only the height. Dashboard already does this correctly — copy the pattern.

---

## Page Grouping for Parallel Work

When two developers work simultaneously, these groupings minimize conflicts:

**Stream A — Detail Pages (similar template)**
- `/sites/[id]`, `/partners/[id]`, `/financiers/[id]` — identical template, one person does all three sequentially.

**Stream B — List Pages**
- `/sites`, `/partners`, `/financiers`, `/external-parties` — identical pattern, one person does all four sequentially.

**Stream C — Complex/Standalone Pages**
- `/transactions`, `/approvals`, `/organization` + sub-pages — each unique enough to require individual attention.

**Stream D — Reports Completion**
- `/reports/daily`, `/reports/monthly` — similar enough to do as a pair.

Streams A and B can run in parallel. Stream C and D should follow A+B, as they benefit from having established patterns from the simpler pages.

---

## Integration Points

### Internal Boundaries

| Boundary | Notes |
|----------|-------|
| `layout.tsx` → all pages | Layout provides outer container. Pages must NOT add competing padding. |
| `TransactionFilters.tsx` → `transactions/page.tsx` | Filter panel is extracted — fix must happen in the component, not the page. |
| `OverviewChart` → `dashboard/page.tsx` | Already responsive. Reference for other Recharts usage. |

### Breakpoints in Use

Tailwind defaults (no custom breakpoints needed):

| Breakpoint | Min-Width | Primary Use |
|------------|-----------|-------------|
| (default) | 0px | Mobile-first base styles |
| `sm:` | 640px | Small phone → tablet pivot |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop (sidebar appears) |
| `xl:` | 1280px | Wide desktop |

The project uses `sm:` and `lg:` most heavily. `md:` is less common but valid for intermediate breakpoints.

---

## Scaling Considerations

Responsive retrofitting has no scaling implications — it is purely CSS class changes. The table below is intentionally N/A:

| Scale | Architecture Adjustments |
|-------|--------------------------|
| All user counts | No backend changes. No performance implications. CSS only. |

---

## Sources

- Direct analysis of `/apps/frontend/src/app/(dashboard)/` — all 21 page files and layout, 2026-02-28
- Direct analysis of `/apps/frontend/src/components/` — sidebar, dashboard chart, transaction filters
- Reference implementation: `dashboard/page.tsx` (fully responsive, gold standard)
- Reference implementation: `reports/kasa-raporu/page.tsx` (table scroll pattern)
- Tailwind CSS 3.4.1 breakpoint documentation (official)
- Radix UI / shadcn/ui Dialog, Table, Sheet sizing conventions

---

*Architecture research for: FinansPro v3 — Mobile Responsive Overhaul*
*Researched: 2026-02-28*
