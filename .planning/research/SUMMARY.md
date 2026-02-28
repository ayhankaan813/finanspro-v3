# Project Research Summary

**Project:** FinansPro v3 — Mobile Responsive Overhaul
**Domain:** Responsive CSS retrofit — B2B financial management SaaS dashboard
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

FinansPro v3 is a B2B internal financial management SaaS built on Next.js 15 (App Router), Tailwind CSS 3.4.1, shadcn/ui, and Recharts. The current stack is fixed — no new packages will be added. The mobile responsive overhaul is a purely presentational retrofit: all changes are Tailwind CSS class additions to existing page files. Zero backend changes, zero data flow changes, zero new packages. The existing layout shell (`lg:pl-64` sidebar offset, container padding) is already correct and should not be touched. Of the 21 frontend pages, 5 are fully responsive (dashboard, 3 report pages, settings), 9 are partially responsive, and 7 have minimal or no responsive handling.

The recommended implementation approach follows a strict dependency order: fix the global foundation first (overflow containment and dialog sizing), then apply established patterns across pages from most-to-least complex. The single most impactful pattern is wrapping every `<table>` element in `overflow-x-auto -mx-3 sm:mx-0` — this alone resolves the primary breakage on the majority of pages. Three pages serve as gold-standard references: `dashboard/page.tsx` (fully responsive, all patterns present), `reports/kasa-raporu/page.tsx` (table scroll reference), and `reports/analysis/page.tsx` (dark mode responsive header). All page work should consult these before implementing.

The primary risks are non-obvious CSS interactions: using `overflow-x: hidden` instead of `overflow-x: clip` will silently break sticky positioning on mobile; dynamically constructing Tailwind breakpoint class names will cause styles to disappear in production builds; and failing to audit existing `table-fixed` usage will result in tables that are still broken despite apparent fixes. All three risks are prevention-oriented — they require establishing correct conventions in the foundation phase before page-by-page work begins. The phased build order in ARCHITECTURE.md is the correct risk mitigation strategy.

---

## Key Findings

### Recommended Stack

The technology stack is frozen. No new installations are permitted. All responsive patterns are achievable with Tailwind CSS 3.4.1 (mobile-first breakpoint utilities), shadcn/ui's `Sheet`, `ScrollArea`, `Dialog`, and `Skeleton` components (already installed), and Recharts' `ResponsiveContainer` (already in use on the dashboard). The project uses standard Tailwind breakpoints: base (mobile 0px), `sm:` (640px), `md:` (768px), `lg:` (1024px, desktop sidebar appears), `xl:` (1280px).

**Core technologies:**
- **Tailwind CSS 3.4.1**: Responsive utilities via mobile-first breakpoint prefixes — the entire responsive system lives here
- **shadcn/ui `Sheet`**: Already used correctly for transaction forms on mobile; pattern to extend to other form overlays
- **shadcn/ui `ScrollArea`**: Already installed; use for horizontal tab scrolling (`TabsList` overflow fix)
- **Recharts `ResponsiveContainer`**: Already used correctly in dashboard; must be applied to all other chart instances
- **Browser DevTools**: 375px (iPhone SE) and 768px (iPad) are the two test breakpoints to verify on every page

### Expected Features

Research distinguishes between this milestone (responsive CSS only) and future work. The internal B2B user base — finance-literate operations staff — prioritizes data density over consumer-friendly simplification. This means horizontal scroll on tables is the correct UX (not card-view transformation), and hiding financial columns on mobile is explicitly an anti-feature.

**Must have (table stakes for this milestone — P1):**
- Global overflow containment — no page-wide horizontal scroll at 375px
- Table horizontal scroll — all `<table>` elements wrapped in `overflow-x-auto`
- Responsive card grids — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N` on all stat card sections
- Dialog mobile sizing — forms usable at 375px without horizontal overflow
- Touch targets minimum 44px — required for EU EAA compliance (effective June 2025)
- Input font-size 16px minimum — prevents iOS Safari auto-zoom on form focus
- Financial number truncation guard — TL amounts never line-break or get cut mid-digit

**Should have (UX improvements — P2, post-validation):**
- Collapsible filter panel on transaction page (hidden on mobile by default)
- Column priority hiding for non-critical table columns (hidden sm:table-cell)
- Compact number formatting on dashboard cards (1.25M vs 1.250.000,00 TL)
- Sticky first column on financial tables (CSS-only position:sticky)

**Defer to v2+:**
- Bottom sticky CTA bar (needs design decision on which actions to surface)
- Swipe-to-expand table rows (requires touch gesture JS)
- Mobile-specific onboarding flow

**Explicit anti-features (do not build):**
- Card-view transformation of tables — destroys comparative scanning needed for financial ops
- Pull-to-refresh gesture — iOS PWA conflicts, React Query handles freshness
- Bottom navigation bar — FinansPro has 10+ sections, bottom nav supports max 5
- Swipe gestures for financial actions — accidental swipe on delete/approve is a financial accuracy risk
- Separate mobile layout routes — doubles maintenance surface permanently

### Architecture Approach

The retrofit is page-level Tailwind class additions only. The architecture is flat: no new components, no new folders, no new abstractions. The two shared files that need a single global fix each are `dialog.tsx` (mobile width/height constraints) and `layout.tsx` (overflow-x containment) — fixing these once applies the fix across all pages. All other work is page-local. The `TransactionFilters.tsx` and `EditableTransactionGrid.tsx` shared components need audits as they are consumed by complex pages.

**Major components and their state:**
1. **`layout.tsx`** — Foundation is DONE and correct; needs one `overflow-x: clip` addition only
2. **`dialog.tsx` (shadcn/ui)** — Needs one mobile-safe sizing update before any transaction page work
3. **Detail pages (sites/partners/financiers [id])** — Identical template; fix one, apply to three
4. **List pages (sites/partners/financiers/external-parties)** — Identical pattern; sequential application
5. **Complex standalone pages (transactions, approvals, organization)** — Each unique; highest effort
6. **Report completion (daily, monthly)** — Need mobile card alternative for `hidden sm:table` pattern

**Build order (from ARCHITECTURE.md):**
Phase 1 (Foundation) → Phase 2 (Conventions) → Phase 3 (Detail pages) → Phase 4 (List pages) → Phase 5 (Complex pages) → Phase 6 (Report completion) → Phase 7 (Final audit)

### Critical Pitfalls

1. **`overflow-x: hidden` breaks sticky positioning** — Any container with `overflow: hidden` becomes a new scroll root, causing sticky headers and the sidebar to stop working on mobile. Use `overflow-x: clip` (not `overflow-hidden`) at the page root. Tailwind lacks an `overflow-x-clip` utility by default; apply as inline style or custom utility. Establish this rule in Phase 1 before touching any page.

2. **Tailwind mobile-first applied backwards** — `sm:` means "640px and above", not "small screens only". Existing code has `text-3xl` headings with no mobile override — they overflow at 375px. Base classes must be mobile-appropriate; breakpoint prefixes scale up. Audit all unprefixed layout-affecting classes in the foundation pass.

3. **Dynamic Tailwind class construction causes production purge** — Any breakpoint variant assembled via string concatenation (`"sm:" + className`) is invisible to Tailwind's JIT scanner and produces no CSS in production builds. Always write full static strings. Never concatenate breakpoint prefixes. Use `safelist` in `tailwind.config.js` only as a last resort.

4. **Tables without proper scroll container cause full-page scroll** — `overflow-x-auto` must be on the immediate parent of the scrollable content, and no ancestor above it should have `overflow: hidden`. The `table-fixed` class (present on sites/partners/financiers detail tables) makes this worse by forcing equal narrow columns with no scroll escape. Remove `table-fixed`, add scroll wrapper.

5. **Recharts `ResponsiveContainer` collapses when parent has no explicit height** — `height="100%"` requires the parent to have a pixel-defined height. `h-auto` parents render the chart at 0x0. Always wrap in `<div className="h-[200px] sm:h-[280px] w-full">`. Also watch `YAxis width={45}` — large TL amounts need at least 60px or labels clip.

6. **shadcn/ui Dialog overflows mobile viewport** — Default `max-w-lg` provides no mobile protection. Transaction forms will overflow 375px screens. Fix `dialog.tsx` once with `max-w-[calc(100vw-32px)] sm:max-w-lg max-h-[90dvh] overflow-y-auto` before working on any transaction or approval page.

---

## Implications for Roadmap

Based on combined research, the implementation has a clear dependency structure. The foundation must be established before page work begins, or page fixes will fight against global overflow bugs. Detail pages should precede list pages (users navigate list → detail; the destination should be polished first). Complex standalone pages come after the pattern is established on simpler pages.

### Phase 1: Foundation Fixes

**Rationale:** Every subsequent page fix depends on the global overflow strategy and dialog behavior. Fixing these first eliminates an entire class of bugs before page-by-page work begins. A single wrong `overflow-hidden` on an ancestor will silently undo all table scroll fixes on that page.

**Delivers:** A stable base where `overflow-x: clip` is the established standard, dialog components are mobile-safe, and the iOS Safari font-size zoom bug is eliminated globally.

**Addresses:** Table stakes P1 features — global overflow, dialog sizing, input font-size
**Avoids:** Pitfall 1 (overflow-hidden breaks sticky), Pitfall 6 (dialog viewport overflow)

**Files to change:**
- `layout.tsx` — add `overflow-x: clip` to page root div (verify sticky header still works)
- `components/ui/dialog.tsx` — add `max-w-[calc(100vw-32px)] sm:max-w-lg max-h-[90dvh] overflow-y-auto`
- Global CSS / Tailwind base — `input, select, textarea { font-size: 16px }` to prevent iOS zoom

**Research flag:** SKIP — patterns are well-documented and verified. Standard Tailwind patterns apply.

---

### Phase 2: Detail Pages (sites/partners/financiers [id])

**Rationale:** These three pages share an identical template (hero balance card + stat grid + year/month selector + financial table). Fix `/sites/[id]` first — it is the most broken (`grid-cols-4 lg:grid-cols-7` collapses hardest at 375px) and sets the pattern for the other two. The pattern established here is then mechanically applied to `/partners/[id]` and `/financiers/[id]`.

**Delivers:** The most-visited destination pages are fully responsive. Mobile users can view site/partner/financier balance details and financial history tables.

**Addresses:** Stats card grid P1 feature, table horizontal scroll P1 feature
**Avoids:** Pitfall 4 (table-fixed without scroll wrapper), Anti-pattern 3 (table-fixed)

**Files to change:**
- `sites/[id]/page.tsx` — grid-cols fix, table scroll wrapper, tab overflow fix
- `partners/[id]/page.tsx` — same pattern applied
- `financiers/[id]/page.tsx` — same pattern applied

**Research flag:** SKIP — identical template across three pages. Once sites/[id] is done, the others are mechanical application.

---

### Phase 3: List Pages (sites/partners/financiers/external-parties)

**Rationale:** List pages are simpler than detail pages (no financial stat tables), but users land here before navigating to detail pages. Card grids and create/edit dialogs are the primary fixes. Dialog fix from Phase 1 already covers the form overlay sizing.

**Delivers:** Entry-point pages work on mobile. Create/edit operations are possible on 375px.

**Addresses:** Card grid P1, dialog sizing P1 (already fixed in Phase 1 — just verify)
**Avoids:** Anti-pattern 1 (page-level padding duplication with layout)

**Files to change:**
- `sites/page.tsx`, `partners/page.tsx`, `financiers/page.tsx`, `external-parties/page.tsx`
- Primarily grid and dialog usage verification

**Research flag:** SKIP — identical pattern across four pages. Low risk.

---

### Phase 4: Transactions Page

**Rationale:** The transactions page is the largest and most complex page in the application. It has a wide filter panel, a multi-column financial table with `table-fixed sm:table-auto` (incorrect — no scroll wrapper), and multiple dialog types. It needs individual attention and cannot be bundled with other pages.

**Delivers:** Core financial operations (create/view transactions) work on mobile.

**Addresses:** Table horizontal scroll P1, filter collapse P2, touch targets P1
**Avoids:** Pitfall 3 (dynamic class purge in transaction badge colors), Pitfall 4 (table without scroll container)

**Files to change:**
- `transactions/page.tsx` — table scroll wrapper, filter collapsing
- `components/transactions/TransactionFilters.tsx` — audit for fixed widths

**Research flag:** NEEDS AUDIT — `TransactionFilters.tsx` and `EditableTransactionGrid.tsx` have unknown responsive state. Audit before implementation.

---

### Phase 5: Approvals and Organization Pages

**Rationale:** Approvals has a card-based layout (easier) but action buttons break at mobile. Organization has Recharts charts (needs `ResponsiveContainer` check) plus sub-pages (personnel, site-profitability) with raw tables.

**Delivers:** Approval workflows usable on mobile. Organization analytics charts visible at 375px.

**Addresses:** Recharts P1 (chart responsive), touch targets P1 (approval action buttons)
**Avoids:** Pitfall 5 (Recharts ResponsiveContainer collapse), Pitfall 2 (backwards breakpoints on action buttons)

**Files to change:**
- `approvals/page.tsx` — header scaling, action button touch targets
- `organization/page.tsx` — Recharts wrapper, stat grid
- `organization/personnel/page.tsx` — table scroll wrapper
- `organization/site-profitability/page.tsx` — audit and apply standard pattern

**Research flag:** NEEDS AUDIT — organization sub-pages have MINIMAL responsive state per ARCHITECTURE.md. Extent of changes unknown until page read.

---

### Phase 6: Report Page Completion (daily/monthly)

**Rationale:** `reports/daily` and `reports/monthly` use `hidden sm:table` — the table is hidden on mobile with no alternative. These need a mobile card view added alongside the existing table. This is a two-view pattern (cards on xs, table on sm+) rather than a simple class addition.

**Delivers:** All report pages are mobile-accessible. Financial reporting works end-to-end on mobile.

**Addresses:** Mobile card alternative for dense tables (P2 differentiator feature)
**Avoids:** Anti-pattern 2 (hiding data on mobile instead of providing scroll or alternative)

**Files to change:**
- `reports/daily/page.tsx` — add mobile card view, keep desktop table
- `reports/monthly/page.tsx` — same pattern

**Research flag:** SKIP — the two-view pattern is documented and implemented in the ARCHITECTURE.md. Straightforward application.

---

### Phase 7: Final Audit

**Rationale:** Some responsive issues only appear at specific breakpoints or on real devices. Browser DevTools simulation is insufficient for iOS Safari-specific bugs. A systematic pass at 375px, 768px, and 1024px on every page catches regressions and missed elements.

**Delivers:** Verified responsiveness across all 21 pages at three breakpoint widths. WCAG 2.5.8 touch target compliance confirmed.

**Addresses:** "Looks done but isn't" checklist from PITFALLS.md
**Avoids:** All pitfalls — this is the verification gate

**Files to change:** Any outstanding issues found during audit

**Research flag:** SKIP — standard QA process. Use PITFALLS.md "Looks Done But Isn't" checklist as the test protocol.

---

### Phase Ordering Rationale

- **Foundation before pages:** `overflow-x: clip` must be established before any table scroll wrapper is added. If any ancestor has `overflow: hidden`, the table scroll wrapper fails silently.
- **Dialog fix before transaction page:** The transaction page has the most dialogs. Fixing `dialog.tsx` once in Phase 1 means Phase 4 transaction work gets the fix automatically.
- **Detail before list:** Users navigate list → detail. Polishing the destination first is the right UX priority order.
- **Transactions isolated:** Too large and unique to bundle with other pages. Its `TransactionFilters` component needs individual attention.
- **Organization after approvals:** Organization has sub-pages with unknown state; approvals is simpler and establishes confidence before tackling organization.
- **Reports last (except completed ones):** Daily/monthly reports require a two-view implementation, which is more work than class additions. Better to finish after patterns are established.

### Research Flags

Phases needing deeper investigation during planning or pre-implementation audit:
- **Phase 4 (Transactions):** `TransactionFilters.tsx` and `EditableTransactionGrid.tsx` have unknown responsive state. Read both files before estimating effort.
- **Phase 5 (Organization):** Sub-pages (`/organization/personnel`, `/organization/site-profitability`) marked MINIMAL — extent of work unknown. Read files during planning.

Phases with well-documented patterns (no research-phase needed):
- **Phase 1 (Foundation):** Patterns are verified against official docs. Mechanical application.
- **Phase 2 (Detail pages):** Sites [id] is the reference; partners/financiers are copies.
- **Phase 3 (List pages):** Identical card+dialog pattern across four pages.
- **Phase 6 (Report completion):** Two-view pattern is fully documented in ARCHITECTURE.md.
- **Phase 7 (Final audit):** Checklist-driven, no research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new packages; all patterns verified against official Tailwind, shadcn/ui, and Recharts docs. Stack is fixed and well-understood. |
| Features | HIGH | P1 features are unambiguous responsive requirements. P2 features have clear rationale. Anti-features are well-argued. Minor caveat: competitor analysis based on product category analysis, not user research. |
| Architecture | HIGH | Based on direct codebase analysis of all 21 pages. Current responsive state mapped per page. Build order is dependency-driven, not arbitrary. |
| Pitfalls | HIGH | All 6 critical pitfalls cross-verified against official GitHub issues (shadcn/ui, Recharts, Tailwind) and MDN/W3C documentation. `overflow-x: clip` vs `overflow: hidden` distinction verified against multiple independent sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **`TransactionFilters.tsx` responsive state:** Listed as NEEDS AUDIT — file not fully analyzed. Read the component before beginning Phase 4 work to avoid scope surprises.
- **`EditableTransactionGrid.tsx` responsive state:** Same — unknown column widths and structure. Audit before Phase 4.
- **Organization sub-page content:** `personnel` and `site-profitability` are marked MINIMAL. The actual number of tables and their column counts affects Phase 5 effort significantly.
- **Dark mode compatibility of sticky columns:** PITFALLS.md flags that `sticky left-0 bg-white` cells need `dark:bg-slate-800` equivalents. This is a finishing detail that should be part of the final audit checklist but could be missed on individual page passes.
- **iOS Safari real-device testing:** DevTools simulation does not replicate all iOS Safari scroll behaviors. A real-device test pass is recommended before marking Phase 7 complete. This is a validation gap, not a research gap.

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS — Responsive Design (official docs)](https://tailwindcss.com/docs/responsive-design) — breakpoints, mobile-first principle
- [Tailwind CSS — Overflow (official docs)](https://tailwindcss.com/docs/overflow) — overflow-x-auto, overflow-x-hidden semantics
- [shadcn/ui GitHub Issue #8098](https://github.com/shadcn-ui/ui/issues/8098) — Dialog overflow on mobile
- [shadcn/ui GitHub Issue #6538](https://github.com/shadcn-ui/ui/issues/6538) — Dialog responsive width
- [shadcn/ui GitHub Issue #2740](https://github.com/shadcn-ui/ui/issues/2740) — Tabs mobile overflow problem
- [Recharts GitHub Issue #1545](https://github.com/recharts/recharts/issues/1545) — ResponsiveContainer height collapse
- [Tailwind dynamic class names — GitHub Discussion #6763](https://github.com/tailwindlabs/tailwindcss/discussions/6763) — Tailwind Labs official response on JIT purging
- [Radix UI scrollbar layout shift — GitHub Discussion #1100](https://github.com/radix-ui/primitives/discussions/1100) — scrollbar-gutter fix
- [WCAG 2.5.8 Target Size — W3C](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) — 44px minimum touch target standard
- Direct codebase analysis — all 21 pages and layout files, 2026-02-28

### Secondary (MEDIUM confidence)
- [Position sticky not working? Try overflow:clip — Terluin Web Design](https://www.terluinwebdesign.nl/en/blog/position-sticky-not-working-try-overflow-clip-not-overflow-hidden/) — verified against MDN; overflow-x: clip vs hidden distinction
- [Getting stuck: all the ways position:sticky can fail — Polypane](https://polypane.app/blog/getting-stuck-all-the-ways-position-sticky-can-fail/) — sticky failure modes
- [Mobile Tables: Comparisons and Other Data Tables — Nielsen Norman Group](https://www.nngroup.com/articles/mobile-tables/) — authoritative UX research for B2B tables
- [Horizontal scrolling on iOS Safari — tailwindlabs/discuss #384](https://github.com/tailwindlabs/discuss/issues/384)
- [Sticky column implementation — CSS-Tricks](https://css-tricks.com/a-table-with-both-a-sticky-header-and-a-sticky-first-column/)
- [Mobile Dashboard UI Best Practices — Toptal](https://www.toptal.com/designers/dashboard-design/mobile-dashboard-ui)

### Tertiary (LOW confidence)
- [Fintech Design Guide — Eleken 2026](https://www.eleken.co/blog-posts/modern-fintech-design-guide) — agency blog; B2B vs consumer distinction cross-checked against NNG
- [Top 10 Fintech UX Design Practices 2026 — Onething Design](https://www.onething.design/post/top-10-fintech-ux-design-practices-2026) — single WebSearch source
- [Mobile Banking App Design — Purrweb](https://www.purrweb.com/blog/banking-app-design/) — consumer fintech; not directly applicable to internal B2B tool

---

*Research completed: 2026-02-28*
*Ready for roadmap: yes*
