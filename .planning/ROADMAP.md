# Roadmap: FinansPro v3 — Mobile Responsive Overhaul

## Overview

Four phases take this project from its current partially-responsive state to full mobile usability at 375px. Phase 1 locks in the global CSS foundation that every page fix depends on. Phase 2 applies the table and grid patterns that are structurally shared across the entire app. Phase 3 fixes all entity detail and list pages using the patterns established in Phase 2. Phase 4 completes the remaining complex pages (transactions, approvals, organization, reports, settings) and adds compact number formatting. When Phase 4 is done, every page in the application is readable and operable at 375px.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Global overflow containment, dialog sizing, iOS Safari input fix, and touch target baseline
- [ ] **Phase 2: Tables and Grids** - All table scroll wrappers and all card grid responsive patterns applied across the app
- [ ] **Phase 3: Entity Pages** - Site, partner, financier, and external-party detail and list pages fully responsive
- [ ] **Phase 4: Feature Pages and Completion** - Transactions, approvals, organization, reports, settings, and compact number format

## Phase Details

### Phase 1: Foundation
**Goal**: The global CSS environment is safe for mobile — no page-level horizontal scroll, dialogs fit 375px screens, iOS Safari does not zoom on input focus, and all interactive elements meet 44px touch target size
**Depends on**: Nothing (first phase)
**Requirements**: GLOB-01, GLOB-02, GLOB-03, GLOB-04, GLOB-05
**Success Criteria** (what must be TRUE):
  1. No page in the application shows a horizontal scrollbar at 375px viewport width after scrolling the page root
  2. Opening any shadcn Dialog (transaction form, edit form) on a 375px screen shows the dialog fully within the viewport without overflowing or clipping
  3. Tapping any input or select field on iOS Safari does not trigger an automatic zoom of the page
  4. Financial amounts (TL values with many digits) never break mid-number across two lines anywhere in the app
  5. Every button, tab, and interactive row is at least 44px tall and tappable without precision on a touch device
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Add .overflow-x-clip utility to globals.css and apply to dashboard layout root div
- [x] 01-02-PLAN.md — Update shadcn dialog.tsx with mobile-safe width, height cap, and internal scroll
- [x] 01-03-PLAN.md — Fix iOS zoom (input/select/textarea text-base), touch targets (button h-11, tabs min-h-[44px]), financial nowrap (.font-amount)

### Phase 2: Tables and Grids
**Goal**: Every table in the application is horizontally scrollable on mobile and every card grid collapses to a single column on mobile without content overflow
**Depends on**: Phase 1
**Requirements**: TABL-01, TABL-02, TABL-03, GRID-01, GRID-02, GRID-03, GRID-04, GRID-05
**Success Criteria** (what must be TRUE):
  1. At 375px, every table in the app can be scrolled horizontally to reveal all columns — no column is clipped or hidden
  2. Table rows never wrap their cell content onto multiple lines; text and numbers stay on one line within each cell
  3. Dashboard summary cards display as a single column at 375px, two columns at 640px, and three or more at 1024px
  4. Site, partner, financier, and external-party list card grids each show one card per row at 375px and two per row at 768px
**Plans**: TBD

Plans:
- [ ] 02-01: Wrap all ~15 tables in overflow-x-auto -mx-3 sm:mx-0 containers; add whitespace-nowrap to all td/th elements
- [ ] 02-02: Apply responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-N to dashboard cards and all four list page card grids

### Phase 3: Entity Pages
**Goal**: Users can view and interact with site, partner, financier, and external-party detail and list pages on a 375px screen without any content overflowing the viewport
**Depends on**: Phase 2
**Requirements**: DETL-01, DETL-02, DETL-03, DETL-04, DETL-05
**Success Criteria** (what must be TRUE):
  1. On a 375px screen, a user can navigate to any site detail page and see the balance card, stat grid, year/month selector, tabs, and transaction table without horizontal overflow
  2. The partner detail page and financier detail page display equivalently to the site detail page — stat cards single-column, tables scrollable — at 375px
  3. The external-party detail page shows all content within the viewport at 375px with no text clipped at the right edge
  4. Tab bars on detail pages (site tabs, partner tabs) scroll horizontally when the tab count exceeds the screen width rather than wrapping or clipping
**Plans**: TBD

Plans:
- [ ] 03-01: Fix sites/[id]/page.tsx — responsive stat grid, table scroll wrapper, ScrollArea on TabsList
- [ ] 03-02: Apply identical pattern to partners/[id]/page.tsx and financiers/[id]/page.tsx
- [ ] 03-03: Fix external-parties/[id]/page.tsx overflow issues

### Phase 4: Feature Pages and Completion
**Goal**: All remaining pages — transactions, approvals, organization, reports, and settings — are fully usable on mobile, and dashboard cards display compact number formats for large financial amounts
**Depends on**: Phase 3
**Requirements**: TXNP-01, TXNP-02, ORGN-01, ORGN-02, ORGN-03, REPT-01, REPT-02, REPT-03, SETT-01, CMPN-01, CMPN-02
**Success Criteria** (what must be TRUE):
  1. A user on a 375px screen can open the transactions page, see the filter controls without overflow, scroll the transaction table horizontally, and open a transaction form dialog that fits within the viewport
  2. The approvals page shows all pending approvals and their action buttons (approve/reject) are reachable and tappable at 375px without horizontal scroll
  3. Organization analytics charts are visible and legible at 375px — ResponsiveContainer fills width, Y-axis labels are not clipped
  4. All three report pages (kasa-raporu, mutabakat, analiz) display correctly at 375px; the daily and monthly reports show content on mobile (not just a hidden table)
  5. Dashboard cards display 1.25M instead of 1.250.000,00 TL for large values; the full value is visible in a tooltip on hover/tap
**Plans**: TBD

Plans:
- [ ] 04-01: Fix transactions/page.tsx — table scroll wrapper, filter layout, TransactionFilters.tsx audit
- [ ] 04-02: Fix approvals/page.tsx — action button touch targets, header scaling
- [ ] 04-03: Fix organization/page.tsx, organization/personnel/page.tsx, organization/site-profitability/page.tsx — Recharts ResponsiveContainer, stat grids, table wrappers
- [ ] 04-04: Fix reports/daily/page.tsx and reports/monthly/page.tsx — add mobile card view alongside hidden desktop table; verify kasa-raporu/mutabakat/analiz at 375px
- [ ] 04-05: Fix settings/page.tsx mobile tab navigation and form fields; add formatMoney compact option; apply to dashboard cards with tooltip

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-28 |
| 2. Tables and Grids | 0/2 | Not started | - |
| 3. Entity Pages | 0/3 | Not started | - |
| 4. Feature Pages and Completion | 0/5 | Not started | - |
