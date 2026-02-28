# Stack Research

**Domain:** Mobile responsive overhaul — Next.js 15 + Tailwind CSS 3.4.1 + shadcn/ui
**Researched:** 2026-02-28
**Confidence:** HIGH

---

## Context

This is a **subsequent milestone** research. The project already runs on a fixed stack:
- **Next.js 15** (App Router)
- **Tailwind CSS 3.4.1** (NOT v4 — upgrading is out of scope)
- **shadcn/ui** + **Radix UI** primitives
- **Recharts** for financial charts

The constraint from PROJECT.md is explicit: **only Tailwind CSS classes — no new packages**. This research documents which utilities, patterns, and Tailwind-native approaches achieve full mobile responsiveness within that constraint.

---

## Recommended Stack

### Core Technologies (Already Installed — No Changes)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Tailwind CSS | 3.4.1 | Responsive utility classes, breakpoints | In use — extend with responsive classes |
| shadcn/ui | Latest | UI primitives (Dialog, Sheet, Tabs, Table) | In use — leverage built-in responsive props |
| Radix UI | Latest | Accessible dialog/sheet/scroll-area | In use — use Sheet for mobile overlays |
| Recharts | Latest | Financial charts | In use — wrap in ResponsiveContainer |

No packages will be added. The full responsive system is achievable with what is already installed.

---

## Core Responsive Patterns (Tailwind CSS 3.4.1)

### 1. Breakpoint System

Tailwind CSS 3.x uses a **mobile-first** breakpoint system. Unprefixed utilities apply to all screen sizes. Prefixed utilities apply at that breakpoint **and above**.

| Prefix | Min Width | Typical Target |
|--------|-----------|----------------|
| (none) | 0px | Mobile (375px+) — base styles |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

**Critical rule (verified — Tailwind official docs):**
```html
<!-- WRONG: This only centers on sm+ screens, mobile gets no centering -->
<div class="sm:text-center"></div>

<!-- CORRECT: Mobile gets centering, sm+ gets left-align override -->
<div class="text-center sm:text-left"></div>
```

The existing layout already uses `lg:pl-64` for sidebar offset and `container px-3 py-1 sm:py-6 lg:px-8` for content padding. This pattern is correct. Apply same discipline to all page components.

---

### 2. Pattern: Responsive Grid Cards

Use for dashboard stat cards, site/partner/financier list cards.

```html
<!-- Mobile: 1 col → Tablet: 2 col → Desktop: 3+ col -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  <div class="rounded-2xl ...">Card</div>
</div>
```

**Why this order:** Starting with `grid-cols-1` (mobile default), then progressively widening. This is mobile-first — never start with `lg:grid-cols-3` and try to override downward.

For financial stat cards with large numbers, add `min-w-0` to grid children to prevent number overflow from breaking the layout:
```html
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div class="min-w-0 rounded-2xl ...">
    <p class="text-2xl font-bold truncate tabular-nums">1.234.567,89 TL</p>
  </div>
</div>
```

---

### 3. Pattern: Responsive Tables (Horizontal Scroll)

**Standard approach — verified across official Tailwind docs and community consensus:**

```html
<!-- Outer: clips overflow, prevents page-wide scroll -->
<div class="overflow-x-auto rounded-xl">
  <!-- Table: ensure minimum width so columns don't collapse -->
  <table class="min-w-full">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

**Why `overflow-x-auto` on the wrapper (not the table):** The table is allowed to be wider than its container. The scroll happens in the wrapper. This preserves all column data without hiding it — the PROJECT.md explicitly requires this for financial data tables.

**Do NOT use `overflow-x-hidden` on `body` or `html`:** This disables mobile scrolling entirely. The correct containment happens at the component level with `overflow-x-auto` wrappers.

For column visibility on narrow screens (optional progressive enhancement):
```html
<th class="hidden md:table-cell">Ortak</th>
<td class="hidden md:table-cell">...</td>
```
Use sparingly — only for truly non-critical columns. For FinansPro, preserve all financial columns and rely on horizontal scroll instead.

---

### 4. Pattern: Financial Number Display

Financial figures in FinansPro (balances, commissions, amounts) must never be clipped or wrapped mid-number. Two approaches:

**Approach A — `tabular-nums` + `truncate` (for card stat display):**
```html
<p class="text-lg font-bold tabular-nums truncate">
  {formatMoney(balance)}
</p>
```
`tabular-nums` ensures digits align. `truncate` prevents wrapping. Use when the container is a fixed card.

**Approach B — `whitespace-nowrap` (for table cells):**
```html
<td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
  {formatMoney(amount)}
</td>
```
`whitespace-nowrap` lets the number extend and forces horizontal scroll in the wrapping `overflow-x-auto` container. Never let a TL amount line-break.

---

### 5. Pattern: Responsive shadcn/ui Tabs

FinansPro uses tabs in site/partner/financier detail pages. The default TabsList in shadcn/ui does not scroll — on narrow screens, too many tabs overflow and break layout.

**Fix — wrap TabsList in overflow scroll container:**
```tsx
<Tabs defaultValue="overview">
  <div className="overflow-x-auto">
    <TabsList className="whitespace-nowrap inline-flex w-auto min-w-full">
      <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
      <TabsTrigger value="transactions">İşlemler</TabsTrigger>
      <TabsTrigger value="stats">İstatistikler</TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="overview">...</TabsContent>
</Tabs>
```

Alternatively, use shadcn/ui `ScrollArea` component (already installed) with `orientation="horizontal"` as the wrapper:
```tsx
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

<ScrollArea className="w-full">
  <TabsList className="whitespace-nowrap">
    ...
  </TabsList>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

**Why:** There is an open shadcn/ui GitHub issue (#2740) documenting this exact Tabs overflow problem. The `overflow-x-auto` wrapper is the community-standard fix. ScrollArea approach is slightly more elegant as it uses an already-installed component.

---

### 6. Pattern: Responsive Dialog/Form Overlays

FinansPro has transaction creation forms as dialogs. On mobile, centered Dialog components are cramped. shadcn/ui `Sheet` (slide-in panel) is better for mobile.

**Current:** Transaction form uses `Sheet` from shadcn/ui — this is already correct. `Sheet` slides from the right and works naturally on mobile.

**For any new dialogs:** Use `Sheet` on mobile, `Dialog` on desktop. Pattern:
```tsx
const isMobile = useMediaQuery("(max-width: 768px)"); // use existing hook or CSS-only approach

// CSS-only approach (preferred — no JS, no new hook):
// SheetContent already handles this with appropriate sizing classes
<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
  ...
</SheetContent>
```

For Dialog components that must remain as Dialog (not Sheet), ensure they are scrollable and use full width on mobile:
```tsx
<DialogContent className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
  ...
</DialogContent>
```

---

### 7. Pattern: Responsive Recharts Charts

FinansPro uses Recharts for financial charts. Charts with fixed pixel widths collapse or overflow on mobile.

**Required:** Always wrap Recharts charts in `ResponsiveContainer`:
```tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// WRONG — fixed width breaks on mobile
<BarChart width={600} height={300} data={data}>

// CORRECT — adapts to parent container width
<div className="w-full h-[200px] sm:h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
      <YAxis width={60} tick={{ fontSize: 11 }} />
      <Tooltip />
      <Bar dataKey="value" />
    </BarChart>
  </ResponsiveContainer>
</div>
```

**Mobile chart adjustments:**
- Reduce `XAxis` tick font size: `tick={{ fontSize: 10 }}`
- Shorten axis labels: use month abbreviations on mobile
- Reduce `YAxis` width from 80 to 55px on mobile to save space
- Use shorter `height` on mobile: `h-[200px] sm:h-[300px]`

The parent container **must have a defined height** — `ResponsiveContainer` cannot size itself to an undefined parent.

---

### 8. Pattern: Global Overflow Containment

The layout already has `container px-3 py-1 sm:py-6 lg:px-8`. Add a global overflow guard to prevent any page from causing horizontal body scroll:

```tsx
// In layout.tsx main wrapper:
<div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 overflow-x-hidden">
```

**Why `overflow-x-hidden` on the page root (not body):** Prevents any overflowing child from creating a horizontal scrollbar on the full page, while still allowing individual `overflow-x-auto` scroll zones within tables/tabs. The page root acts as the clip boundary.

**Critical distinction:**
- `overflow-x-hidden` on `<html>` or `<body>` → disables all mobile scrolling (bad)
- `overflow-x-hidden` on `<div>` page root → creates a scroll clip boundary (correct)

---

### 9. Pattern: Responsive Padding and Spacing

The pattern already established in `layout.tsx` should be applied consistently to every page:

```html
<!-- Padding scales: tight on mobile, comfortable on desktop -->
<div class="p-3 sm:p-6 lg:p-8">

<!-- Typography scales with viewport -->
<h1 class="text-xl sm:text-2xl lg:text-3xl font-bold">

<!-- Gaps scale in grid/flex layouts -->
<div class="grid gap-3 sm:gap-5 lg:gap-6">

<!-- Buttons: full width on mobile, auto on desktop -->
<button class="w-full sm:w-auto">
```

---

## Supporting Libraries (No Installation Required)

These shadcn/ui components are already installed and should be used for responsive patterns:

| Component | Import Path | Use For |
|-----------|-------------|---------|
| `ScrollArea` | `@/components/ui/scroll-area` | Horizontal tab scrolling, long content areas |
| `Sheet` | `@/components/ui/sheet` | Mobile-friendly form overlays |
| `Drawer` | `@/components/ui/drawer` | Bottom-sheet pattern on mobile (if needed) |
| `Skeleton` | `@/components/ui/skeleton` | Loading placeholders for responsive slots |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Browser DevTools | Responsive simulation | Use 375px (iPhone SE) and 768px (iPad) presets |
| Tailwind CSS IntelliSense | VS Code autocomplete | Shows breakpoint prefixes inline |
| Chrome DevTools > Network throttling | Simulate slow 4G | Financial data loads on mobile must be fast |

No new CLI tools or build tools needed. Tailwind 3.4.1's JIT compiler handles all responsive utilities at build time.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Tailwind breakpoint classes | CSS `@media` in stylesheets | Would require `.css` files, harder to co-locate with components, breaks the project constraint of Tailwind-only |
| `overflow-x-auto` wrapper on tables | Card-based row replacement on mobile | Card replacement requires duplicating all data rendering logic; horizontal scroll preserves data without code duplication |
| `ResponsiveContainer` (Recharts) | Fixed pixel chart width | Fixed widths always overflow on 375px screens; `ResponsiveContainer` is the official Recharts solution |
| `ScrollArea` for tabs | Custom scrollbar CSS | `ScrollArea` is already installed, provides cross-browser consistency |
| `Sheet` for mobile forms | `Dialog` on all sizes | `Dialog` centered on a 375px screen wastes vertical space; `Sheet` uses full screen height naturally |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `overflow-x-hidden` on `<html>` or `<body>` | Disables all mobile scrolling, including vertical | Apply to page root `<div>` only |
| Fixed pixel widths on table columns (`w-[200px]`) | Forces tables wider than viewport with no scroll boundary | Use `min-w-[...]` inside `overflow-x-auto` wrapper |
| `@apply` for responsive utilities | Tailwind v4 moving away from `@apply`; defeats co-location benefit of utility classes | Write responsive classes directly in JSX |
| Container queries (`@container`, `@md:`) | Requires Tailwind v4 or `@tailwindcss/container-queries` plugin — out of scope for this project | Use standard viewport breakpoints (`md:`, `lg:`) |
| `whitespace-normal` overriding `whitespace-nowrap` on financial numbers | Allows TL amounts to line-break mid-number | Always keep `whitespace-nowrap` or `tabular-nums truncate` on amounts |
| `hidden` to collapse content on mobile | Hides financial data from mobile users | Use horizontal scroll to preserve all data |

---

## Stack Patterns by Variant

**If a page has a data table with 6+ columns:**
- Use `overflow-x-auto` wrapper + `min-w-full` table
- Add `whitespace-nowrap` to all `<td>` cells with financial data
- Let horizontal scroll be the UX

**If a page has stat cards (balance, commission breakdown):**
- Use `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Add `min-w-0` to card containers
- Use `truncate tabular-nums` on money display elements

**If a page has tabs (site/partner detail):**
- Wrap `TabsList` in `ScrollArea` with `orientation="horizontal"`
- Add `whitespace-nowrap` to `TabsList`

**If a page has a chart:**
- Replace any fixed `width={N}` with `ResponsiveContainer width="100%"`
- Set chart height via parent div: `h-[200px] sm:h-[300px]`

**If a page has forms in dialogs:**
- Keep using `Sheet` (already used in transactions page — correct pattern)
- For `DialogContent`, add `w-full max-w-[95vw] sm:max-w-lg`

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| Tailwind CSS | 3.4.1 | Container queries NOT built-in | Use `@tailwindcss/container-queries` plugin if needed — but not planned |
| shadcn/ui | Latest (React 19) | Next.js 15, React 19 | All responsive patterns here are compatible |
| Recharts | Any | `ResponsiveContainer` stable since v2 | Use `width="100%"` always |

---

## Sources

- [Tailwind CSS — Responsive Design (official docs)](https://tailwindcss.com/docs/responsive-design) — breakpoints, mobile-first principle, container queries — HIGH confidence
- [Tailwind CSS — Overflow (official docs)](https://tailwindcss.com/docs/overflow) — overflow-x-auto, overflow-x-hidden semantics — HIGH confidence
- [Tailwind CSS — Text Overflow (official docs)](https://tailwindcss.com/docs/text-overflow) — truncate, whitespace-nowrap — HIGH confidence
- [shadcn/ui — Scrollable Tabs pattern](https://www.shadcn.io/patterns/tabs-layout-3) — official pattern for tab overflow — HIGH confidence
- [shadcn/ui GitHub Issue #2740](https://github.com/shadcn-ui/ui/issues/2740) — Tabs mobile overflow problem documented — HIGH confidence
- [Recharts ResponsiveContainer pattern](https://www.w3tutorials.net/blog/set-height-and-width-for-responsive-chart-using-recharts-barchart/) — parent must have defined height — MEDIUM confidence (verified against Recharts behavior)
- [shadcn/ui — Sheet component](https://ui.shadcn.com/docs/components/radix/sheet) — slide-in overlay for mobile — HIGH confidence
- [Tailwind CSS v3.2 Container Queries announcement](https://tailwindcss.com/blog/tailwindcss-v3-2) — requires plugin in v3, built-in in v4 — HIGH confidence (explains why container queries are out of scope here)

---

*Stack research for: FinansPro v3 Mobile Responsive Overhaul*
*Researched: 2026-02-28*
