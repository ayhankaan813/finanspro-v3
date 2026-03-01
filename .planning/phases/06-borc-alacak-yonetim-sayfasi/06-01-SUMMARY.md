---
phase: 06-borc-alacak-yonetim-sayfasi
plan: "01"
subsystem: frontend
tags: [debt, hooks, react-query, sidebar, page-skeleton]
dependency_graph:
  requires: []
  provides: [debt-hooks, debt-interfaces, borclar-page-skeleton, sidebar-nav-borclar]
  affects: [apps/frontend/src/hooks/use-api.ts, apps/frontend/src/components/layout/sidebar.tsx, apps/frontend/src/app/(dashboard)/borclar/page.tsx]
tech_stack:
  added: []
  patterns: [react-query-hooks, tanstack-query-mutation, nextjs-app-router-page, shadcn-tabs, shadcn-card, lucide-react-icons]
key_files:
  created:
    - apps/frontend/src/app/(dashboard)/borclar/page.tsx
  modified:
    - apps/frontend/src/hooks/use-api.ts
    - apps/frontend/src/components/layout/sidebar.tsx
decisions:
  - Toplam Alacak calculated from useDebtFinancierSummary sum (not a direct summary field) — consistent with backend data shape
  - Net Durum uses conditional color: green if positive (net alacak), red if negative (net borc)
  - Tab content uses placeholder cards (not empty) so UX is clear that content is coming
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-01"
  tasks_completed: 3
  files_modified: 2
  files_created: 1
---

# Phase 6 Plan 01: Borc/Alacak Hooks + Sidebar + Page Skeleton Summary

**One-liner:** Debt data layer with 8 React Query hooks (5 queries + 3 mutations), 6 TypeScript interfaces, sidebar nav entry, and /borclar page skeleton with 4 live summary cards and 3-tab shell.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add debt TypeScript interfaces and React Query hooks | 086330d | apps/frontend/src/hooks/use-api.ts |
| 2 | Add Borc/Alacak navigation item to sidebar | 28590b6 | apps/frontend/src/components/layout/sidebar.tsx |
| 3 | Create the borclar page with summary cards and tabs skeleton | 9e81433 | apps/frontend/src/app/(dashboard)/borclar/page.tsx |

## What Was Built

### use-api.ts — Debt Data Layer

**6 TypeScript interfaces added:**
- `Debt` — full debt record with lender/borrower relations and optional payments array
- `DebtPayment` — individual payment record
- `DebtSummary` — aggregate summary (total_active_debt, active_debt_count, etc.)
- `DebtFinancierSummary` — per-financier receivable/owed/net breakdown
- `DebtMatrixResponse` — financier matrix with lender/borrower pairs
- `DebtListResponse` — paginated debt list matching backend shape (not using generic PaginatedResponse due to hasNext/hasPrev mismatch)

**8 React Query hooks added:**
- `useDebtSummary()` — GET /api/debts/summary, staleTime 30s
- `useDebts(params?)` — GET /api/debts with optional status/financier_id/pagination filters
- `useDebt(id)` — GET /api/debts/:id (single debt, enabled only when id provided)
- `useDebtFinancierSummary()` — GET /api/debts/financier-summary, staleTime 30s
- `useDebtMatrix()` — GET /api/debts/matrix, staleTime 30s
- `useCreateDebt()` — POST /api/debts, invalidates all debt query keys
- `usePayDebt()` — POST /api/debts/:id/payments, invalidates debts + specific debt + summaries
- `useCancelDebt()` — PATCH /api/debts/:id/cancel, invalidates debts + specific debt + summaries

### sidebar.tsx — Navigation

- `HandCoins` icon imported from lucide-react
- `Borc/Alacak` NavItem added to HESAPLAR group with `href: "/borclar"`, positioned after `Dis Kisiler`

### borclar/page.tsx — Page Skeleton

- Header: `from-slate-900 to-slate-800` gradient per project convention, title "Borc/Alacak Yonetimi", subtitle, and "Yeni Borc" button (placeholder for Plan 06-02)
- 4 summary cards on responsive grid (1/2/4 col breakpoints):
  - **Toplam Borc** (red, TrendingDown icon): from `useDebtSummary.total_active_debt`
  - **Toplam Alacak** (green, TrendingUp icon): calculated as `sum(financierSummary.total_receivable)`
  - **Net Durum** (blue Scale icon, value color conditional): `totalReceivable - totalOwed`
  - **Aktif Borc** (amber, Activity icon): from `useDebtSummary.active_debt_count`
- Skeleton loading state for all 4 cards while fetching
- 3-tab shell: Acik Borclar / Islem Gecmisi / Finansor Matrix — each with placeholder card (icon + message)
- All financial amounts via `formatMoney()` with `font-mono` class
- Touch-friendly: TabsTrigger has `min-h-[44px]`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Checking created files and commits...

## Self-Check: PASSED

All files present:
- FOUND: apps/frontend/src/hooks/use-api.ts
- FOUND: apps/frontend/src/components/layout/sidebar.tsx
- FOUND: apps/frontend/src/app/(dashboard)/borclar/page.tsx

All commits verified:
- FOUND: 086330d (feat: debt hooks to use-api.ts)
- FOUND: 28590b6 (feat: sidebar nav entry)
- FOUND: 9e81433 (feat: borclar page skeleton)
