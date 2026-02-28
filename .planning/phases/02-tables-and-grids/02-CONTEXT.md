# Phase 2: Tables and Grids - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Every table in the application is horizontally scrollable on mobile and every card grid collapses properly on mobile without content overflow. This is an incremental improvement phase — fix what's broken, don't redesign what works.

</domain>

<decisions>
## Implementation Decisions

### Approach philosophy
- Do NOT redesign from scratch — improve existing code
- Only fix pages/components that are actually broken or not mobile-friendly
- If a table or grid already works well on mobile, leave it alone
- Incremental fixes, not a UI overhaul

### Table scroll behavior
- Current site detail (sites/[id]) and partner detail (partners/[id]) table design is approved as-is — horizontal scroll works, alternating row colors good
- shadcn Table component already wraps in `overflow-auto` — leverage this
- Add `whitespace-nowrap` to cells where content wrapping breaks readability
- Wrap tables in `-mx-3 sm:mx-0` negative margin containers for edge-to-edge mobile scroll where needed

### Card grid behavior
- Dashboard summary cards and list page card grids: inspect current code, fix only what's broken at 375px
- Don't enforce rigid breakpoint rules if existing responsive behavior already works
- Success criteria targets: 1 col at 375px, 2 col at 640px, 3+ at 1024px for dashboard; 1 card/row at 375px, 2 at 768px for list pages — but only adjust pages that don't meet this

### Claude's Discretion
- Color choices for any new visual elements (scroll indicators, etc.)
- Which specific tables need `whitespace-nowrap` vs which already work
- Exact padding/margin adjustments per page
- Whether to add visual scroll hints (gradient fade) or rely on native scroll
- Sticky first column: decide per table based on column count and importance

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/table.tsx`: shadcn Table with `overflow-auto` wrapper — base for all tables
- `components/ui/card.tsx`: shadcn Card component used across all pages
- Phase 1 added `overflow-x-clip` to layout.tsx — prevents horizontal page overflow

### Established Patterns
- Tables use shadcn Table components (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- Some report pages already have `overflow-x-auto` wrappers (monthly, daily, kasa-raporu, reconciliation)
- Card grids use Tailwind `grid grid-cols-X` with responsive breakpoints — pattern varies per page
- Site detail: `grid-cols-4 lg:grid-cols-7` for summary stats
- Partner detail: `grid-cols-3` for summary cards
- Dashboard: `grid-cols-1 lg:grid-cols-12` layout
- List pages: sites `md:grid-cols-2 xl:grid-cols-3`, partners `md:grid-cols-2 lg:grid-cols-3`, financiers `md:grid-cols-2 lg:grid-cols-3`, external-parties `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

### Pages with Tables (~11)
- `transactions/page.tsx` — transaction list table
- `partners/[id]/page.tsx` — partner daily detail (approved design)
- `financiers/[id]/page.tsx` — financier daily detail
- `external-parties/[id]/page.tsx` — external party transactions
- `reports/kasa-raporu/page.tsx` — kasa report (already has overflow-x-auto + sticky first col)
- `organization/personnel/page.tsx` — personnel table
- `sites/[id]/page.tsx` — site daily detail (approved design)
- `reports/daily/page.tsx` — daily report (already has overflow-x-auto)
- `reports/monthly/page.tsx` — monthly report (already has overflow-x-auto)
- `reports/reconciliation/page.tsx` — reconciliation (already has overflow-x-auto)
- `bulk-import/EditableTransactionGrid.tsx` — editable grid

### Integration Points
- All pages under `app/(dashboard)/` layout
- Phase 1's `overflow-x-clip` on layout prevents body-level horizontal scroll

</code_context>

<specifics>
## Specific Ideas

- Site detail page (TEAM-1 screenshot) with 8-column table and alternating orange/white rows — this is the reference design, don't change it
- Partner detail page (YAGIZ screenshot) with 5-column table — also approved, don't change
- Reports that already have `overflow-x-auto` (kasa-raporu, daily, monthly, reconciliation) — likely already working, verify and skip if fine

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-tables-and-grids*
*Context gathered: 2026-02-28*
