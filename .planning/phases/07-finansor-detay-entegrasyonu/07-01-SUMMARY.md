---
phase: 07-finansor-detay-entegrasyonu
plan: "01"
subsystem: frontend
tags: [debt, financier-detail, react-query, tabs, ui]
dependency_graph:
  requires: [Phase 05 debt schema, Phase 06 debt hooks/API]
  provides: [useFinancierDebtSummary hook, FinancierDetailPage debt integration]
  affects: [apps/frontend/src/hooks/use-api.ts, apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [client-side filter from bulk query, Fragment for multi-row table renders, conditional color on net position]
key_files:
  created: []
  modified:
    - apps/frontend/src/hooks/use-api.ts
    - apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx
decisions:
  - useFinancierDebtSummary derives from useDebtFinancierSummary (no new API endpoint — client-side filter)
  - Debt summary card shown only if debtSummary has data or is loading (hidden for financiers with no debts)
  - Existing statistics content wrapped in Tabs without changing any existing code
  - Fragment used for multi-row table renders to avoid React key warnings
  - Alacakli/Borclu role computed from lender_id === financierId comparison
metrics:
  duration: "~4 min (217 seconds)"
  completed: "2026-03-02"
  tasks_completed: 2
  files_modified: 2
requirements_satisfied: [FDET-01, FDET-02]
---

# Phase 7 Plan 01: Finansor Detay Debt Entegrasyonu Summary

**One-liner:** Debt summary card (Toplam Alacak, Toplam Borc, Net Pozisyon) and expandable Borc/Alacak tab integrated into financier detail page using client-side filtered useFinancierDebtSummary hook.

## What Was Built

### Task 1: useFinancierDebtSummary hook (use-api.ts)

Added `useFinancierDebtSummary(financierId: string)` convenience hook to `apps/frontend/src/hooks/use-api.ts`. Placed after `useDebtFinancierSummary` definition, before `useDebtMatrix`. The hook derives its data from the existing `useDebtFinancierSummary` bulk query by filtering client-side — no new backend API call needed. Returns `{ data: { total_receivable, total_owed, net_position } | null, isLoading, error }`.

### Task 2: Debt Summary Card + Borc/Alacak Tab (financiers/[id]/page.tsx)

Transformed `apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` from 489 lines to 759 lines with:

**Debt Summary Card:**
- Slate gradient card placed between Balance Card and Tabs
- Shows HandCoins icon, "Borc/Alacak Durumu" label
- Net Pozisyon value: emerald-300 when >= 0 (Net Alacak), rose-300 when < 0 (Net Borc)
- Side columns show Toplam Alacak (emerald) and Toplam Borc (rose)
- Skeleton loading state while `isLoadingDebtSummary`
- Card hidden entirely when financier has no debts and is not loading

**Tabbed Layout:**
- `<Tabs defaultValue="stats">` wraps all previous content starting from Stats Grid
- Two tabs: "Istatistikler" (TrendingUp icon) and "Borc/Alacak" (HandCoins icon)
- Both TabsTrigger have `min-h-[44px]` for touch accessibility
- All existing statistics content (stats grid, month/year selector, data table, active blocks, legend) moved into `<TabsContent value="stats">` unchanged

**Borc/Alacak Tab:**
- Fetches debts with `useDebts({ financier_id, page, limit: 20 })`
- Table columns: Karsi Taraf, Rol, Baslangic, Kalan, Ilerleme, Tarih, Durum, expand toggle
- Role badge: "Alacakli" (emerald) if `lender_id === financierId`, "Borclu" (rose) otherwise
- Progress bar via plain div width% (consistent with borclar page — shadcn Progress not installed)
- Color thresholds: >= 67% emerald, >= 33% amber, < 33% rose
- Click row to expand — uses `Fragment key={debt.id}` for the two-row pattern
- Expanded row shows payment history via `useDebt(expandedDebtId)`
- Debt description shown in expanded row if present
- Empty state with HandCoins icon when no debts
- Pagination shown when `totalPages > 1`
- Skeleton (5 rows) while loading

## Decisions Made

1. **Client-side filter over new backend endpoint:** `useFinancierDebtSummary` reuses `useDebtFinancierSummary` (already cached at 30s staleTime). Cache invalidation already covers all debt mutations. This is the same pattern used throughout the app.

2. **Debt card visibility:** Only renders when `isLoadingDebtSummary || debtSummary` — avoids showing an empty card for financiers with no debt relationships.

3. **Fragment for table rows:** `<Fragment key={debt.id}>` wraps the main row + expanded detail row to avoid React key warnings with multi-row patterns.

4. **Alacakli vs Borclu terminology:** "Alacakli" (has receivable) = lender role, "Borclu" (owes) = borrower role — consistent with financial domain language.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] `apps/frontend/src/hooks/use-api.ts` modified — useFinancierDebtSummary added
- [x] `apps/frontend/src/app/(dashboard)/financiers/[id]/page.tsx` modified — 759 lines (>= 550 required)
- [x] Commit d4a5503: feat(07-01): add useFinancierDebtSummary hook
- [x] Commit 06e2cad: feat(07-01): add debt summary card and Borc/Alacak tab
- [x] TypeScript compiles (no new errors beyond pre-existing kasa-raporu)

## Self-Check: PASSED
