# Feature Research

**Domain:** Mobile-responsive financial dashboard (SaaS, B2B internal tool)
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH (verified against multiple sources; some specific fintech findings are WebSearch-only)

---

## Context: What FinansPro v3 Actually Is

This is NOT a consumer banking app. It is an internal B2B financial management SaaS used by operators managing sites, partners, financiers, and transaction flows. Users are finance-literate internal staff, not end consumers. This distinction matters for feature decisions: we prioritize density of information and operational accuracy over consumer-friendly simplicity.

The mobile work here is a **responsive overhaul only** — no new features, no redesign, no backend changes. The project constraint is: make existing content work on 375px screens using only Tailwind CSS classes.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist on mobile. Missing any of these = product feels broken, not just incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| No horizontal overflow / content clipping | Standard mobile web behavior since 2015 | LOW | `overflow-x: hidden` on root + proper `max-w` on children. Currently broken on most pages. |
| Readable financial numbers at 375px | Primary purpose of the app is showing money values | LOW | Numbers must not be cut off mid-digit. Use `min-w-0 + truncate` or abbreviate with K/M suffix for display. |
| Tables scrollable horizontally on mobile | Financial tables have 6-10 columns; data cannot be hidden | MEDIUM | Wrap tables in `overflow-x-auto` container with `whitespace-nowrap` on cells. NOT card-view transformation — data integrity matters more than aesthetics for internal tools. |
| Cards stack to single column on mobile | Standard responsive grid behavior | LOW | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` already the Tailwind pattern. Missing on several pages. |
| Dialogs/modals fit within viewport | Forms must be usable on 375px | MEDIUM | `max-h-[90vh] overflow-y-auto` on dialog content. Shadcn Dialog component needs width override for mobile. |
| Touch-friendly tap targets (minimum 44px height) | WCAG 2.5.8 AA compliance (legally required in EU from June 2025) | LOW | All interactive elements: buttons, rows, tabs need `min-h-[44px]` or equivalent padding. |
| Charts resize without breaking layout | Dashboard and analytics rely on charts; broken chart = broken page | LOW | Recharts `ResponsiveContainer` already handles this IF parent container has defined width. Fix parent constraints. |
| Sidebar overlay/hamburger works correctly | Navigation must be accessible on mobile | LOW | Already implemented per PROJECT.md — verify it works without main content showing behind overlay. |
| Form inputs usable on mobile | All CRUD operations must work on mobile | MEDIUM | Input font-size must be 16px minimum (prevents iOS zoom on focus). Labels must be visible. |
| Empty states and loading states responsive | Every page has loading and empty states | LOW | These are simpler than data states — usually already OK, but need verification. |

### Differentiators (Competitive Advantage)

Features that go beyond basic responsiveness to create genuine mobile usability improvements. These are NOT in PROJECT.md scope but are identified as high-ROI additions if scope expands.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Sticky table headers on horizontal scroll | Keeps column context visible when scrolling wide financial tables horizontally | MEDIUM | CSS `position: sticky` + `left: 0` on first column (e.g., date/name). Works with `overflow-x-auto` wrapper. Pure CSS, no JS. |
| Financial number abbreviation (1.250.000 → 1,25M) | Prevents number truncation on narrow screens without losing information | LOW | Implement in `formatMoney()` utility with a `compact` option. Show full value in tooltip on hover. Context-appropriate: use on dashboard cards, not in transaction detail rows. |
| Collapsible filter panels on mobile | Transaction page has many filters; on mobile they should be hidden by default behind a toggle | LOW | Single `useState` + `sm:hidden` reveal logic. No new dependencies. Tailwind only. |
| Column-priority hiding on narrow screens | Hide low-priority table columns on mobile while keeping critical ones (date, amount, status) | MEDIUM | Use `hidden sm:table-cell` on secondary columns. Requires identifying column priority per table. |
| Bottom sheet for action menus on mobile | DropdownMenus on mobile open near top of screen; bottom sheets feel more native | HIGH | Requires detecting mobile viewport and conditionally rendering Sheet instead of DropdownMenu. Radix UI Sheet already in project — but conditional rendering logic adds complexity. |
| Sticky action bar at bottom of mobile screen | "New Transaction" or primary CTA accessible without scrolling back to top | MEDIUM | Fixed bottom bar: `fixed bottom-0 inset-x-0 bg-white border-t py-3 px-4 lg:hidden`. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good ideas but create real problems in this specific context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Card view transformation of tables on mobile | Popular pattern in consumer apps; looks clean | Internal financial tools need row comparison (e.g., comparing 5 transactions side by side). Card view destroys comparative scanning. Also doubles the implementation complexity with two rendering paths. | Horizontal scroll with frozen first column. Simpler, preserves data integrity, what financial ops users actually need. |
| Pull-to-refresh gesture | Native app feel | iOS PWA has documented broken pull-to-refresh behavior (it conflicts with browser's native scroll). React Query's stale-while-revalidate already handles data freshness. Adds JS complexity and platform-specific bugs. | React Query `refetchOnWindowFocus: true` (already default). Manual refresh button if truly needed. |
| Bottom navigation bar replacing sidebar | Better mobile UX for consumer apps | FinansPro has 10+ top-level sections (sites, partners, financiers, transactions, approvals, reports, settings, organization, external-parties). Bottom nav supports max 5 items. Would require restructuring the IA. | Hamburger sidebar (already working). If bottom nav is desired, needs separate IA redesign project — out of scope. |
| Swipe gestures (swipe to delete/approve) | Feels native, looks modern | iOS Safari's "swipe back" navigation gesture conflicts with left-right swipe actions. Financial operations (delete, approve) need explicit confirmation, not accidental swipes. | Explicit action buttons (MoreHorizontal dropdown), already implemented. |
| Pinch-to-zoom on charts | Seems intuitive for data exploration | Creates conflict with browser's pinch-to-zoom. Financial data already filterable by date range — zooming adds complexity without reducing the need for filtering. | Date range filter (already implemented). Recharts' built-in tooltip on tap shows point values. |
| Separate mobile layout/routes | Some apps build dedicated mobile pages | Doubles the maintenance surface permanently. Every future feature needs to be built twice. | Single responsive layout via Tailwind breakpoints. The entire constraint of this project. |
| Offline mode / service worker caching | PWA capability | Financial data must be real-time accurate. Cached stale balances are worse than no data — they create trust and accuracy problems for financial operations. | Clear loading states and error states when offline. Rely on React Query's cache for in-session performance only. |

---

## Feature Dependencies

```
[Responsive container fix]
    └──enables──> [Table horizontal scroll]
                      └──enables──> [Sticky first column]

[Form dialog mobile fix]
    └──requires──> [Input 16px font-size fix]

[formatMoney compact mode]
    └──enhances──> [Dashboard number readability]
    └──enhances──> [Chart axis labels]

[Overflow-x hidden on root]
    └──enables──> ALL other responsive fixes (without this, fixes fight against page overflow)

[Touch target sizing]
    └──applies-to──> [Table action dropdowns]
    └──applies-to──> [Pagination buttons]
    └──applies-to──> [Tab navigation]
    └──applies-to──> [Form submit buttons]
```

### Dependency Notes

- **Overflow-x hidden must come first:** Every page needs `overflow-x: hidden` at the layout level before table/card fixes work correctly. Adding `overflow-x-auto` to a table inside a page that itself overflows does nothing.
- **Input 16px minimum is a prerequisite for form usability:** iOS Safari auto-zooms when an input has font-size < 16px, making the entire form layout jump. This must be set globally or it will be forgotten page-by-page.
- **Chart fixes are simpler than they look:** Recharts `ResponsiveContainer` already does the work. The bug is always the parent container having no defined width. Fix the parent, not the chart component.
- **Dialog/Sheet responsiveness:** Radix UI Dialog already has mobile-aware positioning logic, but the content width needs `w-full max-w-lg` to prevent overflow on 375px. This is a single CSS fix, not a component rewrite.

---

## MVP Definition

### Launch With (v1 — this milestone)

The minimum to make the app non-embarrassing and actually usable on mobile. All of these use only Tailwind CSS classes.

- [ ] **Global overflow fix** — `overflow-x: hidden` at layout root. Fixes ghost horizontal scroll on every page. 1-line fix in `layout.tsx`.
- [ ] **Table horizontal scroll** — Wrap all `<table>` elements in `overflow-x-auto` container. Prevents table from breaking page layout. ~15 tables across pages.
- [ ] **Card grid responsive** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` on all card grids. Currently missing on sites, partners, financiers list pages.
- [ ] **Dialog mobile sizing** — `w-full max-w-lg max-h-[90vh] overflow-y-auto` on all Dialog content. Prevents forms from overflowing screen.
- [ ] **Touch targets minimum 44px** — `min-h-[44px]` padding on all interactive rows, buttons, and tabs. Required for EU EAA compliance (effective June 2025).
- [ ] **Input font-size 16px** — Global CSS rule `input, select, textarea { font-size: 16px; }` or Tailwind `text-base` on all inputs. Prevents iOS Safari auto-zoom.
- [ ] **Financial number truncation guard** — `min-w-0 flex-shrink-0` on number containers + `truncate` only on labels, never on monetary values.

### Add After Validation (v1.x)

These add genuine UX improvement but are not blocking usability.

- [ ] **Collapsible filter panel on mobile** — Transaction page filters: hidden on mobile by default, revealed via "Filtrele" button. Adds usable space above the table fold.
- [ ] **Column priority hiding** — Hide tertiary columns (e.g., "Notlar", "Referans") on `sm:` and below. Show core columns only: date, type, amount, status.
- [ ] **Compact number formatting** — `formatMoney(amount, { compact: true })` showing `1,25M` instead of `1.250.000,00 ₺` on dashboard cards. Full amount in tooltip.
- [ ] **Sticky first column on tables** — Freeze the date/name column when scrolling wide transaction tables. CSS-only with `position: sticky left-0`.

### Future Consideration (v2+)

These require IA or design decisions beyond responsive CSS.

- [ ] **Bottom sticky CTA bar** — Requires design decision on which actions to surface. Good UX but adds persistent UI element that needs careful placement.
- [ ] **Swipe-to-expand table rows** — Revealing additional row data on mobile without card transformation. Requires touch gesture JS.
- [ ] **Mobile-specific onboarding** — First-time mobile user flow. Only relevant once mobile user base is validated.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Global overflow-x fix | HIGH | LOW | P1 |
| Table horizontal scroll | HIGH | LOW | P1 |
| Dialog mobile sizing | HIGH | LOW | P1 |
| Touch targets 44px | HIGH | LOW | P1 |
| Input font-size 16px | HIGH | LOW | P1 |
| Card grid responsive | HIGH | LOW | P1 |
| Financial number guard | HIGH | LOW | P1 |
| Collapsible filters (mobile) | MEDIUM | LOW | P2 |
| Column priority hiding | MEDIUM | MEDIUM | P2 |
| Compact number formatting | MEDIUM | LOW | P2 |
| Sticky first column | MEDIUM | LOW | P2 |
| Bottom sticky CTA | LOW | MEDIUM | P3 |
| Swipe gestures | LOW | HIGH | P3 |
| Card view for tables | LOW | HIGH | P3 (anti-feature) |

**Priority key:**
- P1: Must have for this milestone — user cannot use app on mobile without these
- P2: Should have — noticeably improves mobile UX, low cost
- P3: Nice to have or explicitly deferred — high cost, low internal-tool value, or anti-feature

---

## Competitor Feature Analysis

Context: FinansPro is an internal B2B tool, not a consumer fintech product. Direct competitors are internal dashboards, not Mint or Revolut. Most relevant reference points are tools like QuickBooks Online Mobile, Xero Mobile, and internal ERP dashboards.

| Feature | QuickBooks Online Mobile | Xero Mobile | Our Approach |
|---------|--------------------------|-------------|--------------|
| Table handling | Card-per-transaction (consumer-style) | Horizontal scroll with priority columns | Horizontal scroll — matches internal tool data needs |
| Navigation | Bottom tab bar (5 items) | Bottom tab bar (4 items) | Hamburger sidebar — we have 10+ sections, bottom bar doesn't scale |
| Filters | Slide-in panel (sheet) | Inline collapsed | Collapsible inline panel — simpler, no new components |
| Number display | Full with scrollable row | Abbreviated with tap-to-expand | Full with horizontal scroll on table; abbreviated on dashboard cards |
| Dialogs | Full-screen modals on mobile | Drawer from bottom | Constrained dialog (max-h-90vh) — avoids full-screen complexity |
| Charts | Simplified chart on mobile | Same chart, responsive container | Same chart, responsive container — sufficient for internal use |

**Note:** Consumer fintech apps (Revolut, Monzo) are not relevant competitors. Their UX patterns optimize for first-time user engagement, not financial operations density. Do not borrow their patterns without acknowledging this mismatch. (Confidence: MEDIUM — based on product category analysis, not user research)

---

## Page-by-Page Feature Inventory

Based on codebase inspection, these are the specific responsive issues per page category:

| Page Category | Known Issues | Required Fix Category |
|---------------|--------------|----------------------|
| Dashboard (`/dashboard`) | Already partially responsive (sm/lg breakpoints present) | Chart container width, number overflow guard |
| Sites list (`/sites`) | Grid layout unclear without full read | Card grid, dialog sizing |
| Site detail (`/sites/[id]`) | Tab navigation, statistics section | Tab overflow, stats grid |
| Partners (`/partners`) | Same pattern as sites | Card grid, dialog sizing |
| Financiers (`/financiers`) | Same pattern as sites | Card grid, dialog sizing |
| Transactions (`/transactions`) | Many filter inputs + wide table | Filter collapse, table scroll, dialog sizing |
| Approvals (`/approvals`) | Table with action buttons | Table scroll, touch targets |
| Reports (`/reports/*`) | Already partially fixed (kasa-raporu, mutabakat, analiz done per MEMORY.md) | Verify 375px renders correctly |
| Organization (`/organization`) | Analytics charts + sub-pages | Chart containers, grid layout |
| Settings (`/settings`) | Tabs + form sections | Tab overflow, form layout |
| External parties (`/external-parties`) | Detail page known broken (per PROJECT.md) | Overflow, grid |

---

## Sources

- [Mobile-First Table Design Principles — NinjaTables](https://ninjatables.com/mobile-first-table-design-principles/) (MEDIUM confidence — verified approach matches NN/G guidance)
- [Mobile Tables: Comparisons and Other Data Tables — Nielsen Norman Group](https://www.nngroup.com/articles/mobile-tables/) (HIGH confidence — authoritative UX research)
- [Fintech Design Guide — Eleken 2026](https://www.eleken.co/blog-posts/modern-fintech-design-guide) (LOW confidence — agency blog, single source)
- [Top 10 Fintech UX Design Practices 2026 — Onething Design](https://www.onething.design/post/top-10-fintech-ux-design-practices-2026) (LOW confidence — single WebSearch source)
- [Responsive Tables Without Compromising UX — NinjaTables](https://ninjatables.com/responsive-tables/) (MEDIUM confidence — technical guidance verified against Tailwind docs)
- [Tailwind CSS Overflow Docs](https://tailwindcss.com/docs/overflow) (HIGH confidence — official documentation)
- [Tailwind CSS Responsive Design Docs](https://tailwindcss.com/docs/responsive-design) (HIGH confidence — official documentation)
- [WCAG 2.5.8 Target Size — W3C](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) (HIGH confidence — official standard; legally required EU EAA June 2025)
- [Bottom Navigation Bar Complete Guide — AppMySite](https://blog.appmysite.com/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/) (LOW confidence — single WebSearch source)
- [Mobile Banking App Design Best Practices 2026 — Purrweb](https://www.purrweb.com/blog/banking-app-design/) (LOW confidence — single WebSearch source)
- [Mobile Dashboard UI Best Practices — Toptal](https://www.toptal.com/designers/dashboard-design/mobile-dashboard-ui) (MEDIUM confidence — referenced by multiple sources)

---

*Feature research for: FinansPro v3 Mobile Responsive Overhaul*
*Researched: 2026-02-28*
*Scope constraint: Tailwind CSS only, no new packages, no design changes, no backend changes*
