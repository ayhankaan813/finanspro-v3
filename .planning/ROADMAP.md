# Roadmap: FinansPro v3

## Milestones

- [x] **v1.0 Mobile Responsive Overhaul** — Phases 1-4 (in progress, Phases 1-2 complete)
- **v1.1 Kasalar Arasi Borc/Alacak** — Phases 5-7 (current milestone)

## Phases

<details>
<summary>v1.0 Mobile Responsive Overhaul (Phases 1-4)</summary>

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
**Plans**: 3 plans

Plans:
- [x] 02-01: Wrap all ~15 tables in overflow-x-auto -mx-3 sm:mx-0 containers; add whitespace-nowrap to all td/th elements
- [x] 02-02: Apply responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-N to dashboard cards and all four list page card grids
- [x] 02-sticky-1: Add sticky date column to monthly report and financier detail tables

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

</details>

---

### v1.1 Kasalar Arasi Borc/Alacak (Current Milestone)

**Milestone Goal:** Finansorler arasinda borc verme/alma, serbest geri odeme, ve tum borc/alacak durumunun tek noktadan takibi.

#### Phase 5: Data Foundation and API
**Goal**: Finansorler arasinda borc ve odeme kaydi olusturulabilir, iptal edilebilir — backend hazir
**Depends on**: Nothing (brownfield, existing financier system in place)
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. Admin yeni bir borc kaydi olusturabilir: borc veren finansor, borc alan finansor, tutar, tarih ve aciklama girildiginde kayit veritabanina yazilir
  2. Acik bir borca karsi kismi veya tam odeme kaydedilebilir; her odemenin kalan bakiyeye etkisi aninda hesaplanir
  3. Yanlis girilen bir borc kaydi iptal edilebilir; iptal edilen kayit listede gorunur ancak toplam hesaplamalara dahil edilmez
  4. Borc ve odeme kayitlarina serbest metin aciklama eklenebilir ve bu aciklama API response'unda donus yapar
**Plans**: TBD

Plans:
- [ ] 05-01: Prisma — Debt ve DebtPayment tablolarini olustur, migrate et, seed'e ornek veri ekle
- [ ] 05-02: Backend — debt.service.ts ve debt.controller.ts (create, pay, cancel, list endpoints)

#### Phase 6: Borc/Alacak Yonetim Sayfasi
**Goal**: Kullanici tek bir sayfada tum borclari ozet, liste, gecmis ve matrix seklinde gorebilir
**Depends on**: Phase 5
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Borc/Alacak sayfasinin ustten ozet kartlarinda toplam borc, toplam alacak, net durum ve aktif borc sayisi dogru rakamlarla gorunur
  2. Acik borclar listesinde sadece kapanmamis borclar listelenir; her satir borc veren, borc alan, baslangic tutari ve kalan bakiyeyi gosterir
  3. Islem gecmisi sekmesinde tum borc verme ve odeme kayitlari kronolojik siraya gore listelenir
  4. Finansor matrix tablosunda her finansorun diger finansorlere olan borc/alacak bakiyesi satir/sutun kesisimlerinde gorulur
**Plans**: 3 plans

Plans:
- [x] 06-01: Frontend — Debt React Query hooks + sidebar nav + /borclar page skeleton with summary cards (PAGE-01)
- [x] 06-02: Frontend — Acik borclar listesi (PAGE-02), islem gecmisi (PAGE-03), create/payment/cancel dialogs (PAGE-01)
- [x] 06-03: Frontend — Finansor matrix cross-table with heat map (PAGE-04)

#### Phase 7: Finansor Detay Entegrasyonu
**Goal**: Mevcut finansor detay sayfasi borc/alacak ozeti ve detay tab'i ile zenginlestirilir
**Depends on**: Phase 5
**Requirements**: FDET-01, FDET-02, FDET-03
**Success Criteria** (what must be TRUE):
  1. Finansor detay sayfasinda ozet kart alani bu finansorun toplam alacagi, toplam borcu ve net pozisyonunu gosterir
  2. Finansor detay sayfasindaki Borc/Alacak tab'i bu finansorle ilgili tum borc ve odeme kayitlarini listeler
  3. Finansor detay sayfasinda "Borc Ver/Al" butonu tiklandiginda dogrudan bu finansore alinmis veya verilen borc olusturma formu acar
**Plans**: TBD

Plans:
- [x] 07-01: Frontend — finansors/[id]/page.tsx'e borc/alacak ozet karti ve Borc/Alacak tab'i ekle
- [x] 07-02: Frontend — Borc Ver/Al quick-action butonu ve modal form entegrasyonu

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-28 |
| 2. Tables and Grids | v1.0 | 3/3 | Complete | 2026-02-28 |
| 3. Entity Pages | v1.0 | 0/3 | Not started | - |
| 4. Feature Pages and Completion | v1.0 | 0/5 | Not started | - |
| 5. Data Foundation and API | 2/2 | Complete   | 2026-02-28 | - |
| 6. Borc/Alacak Yonetim Sayfasi | 3/3 | Complete   | 2026-03-01 | - |
| 7. Finansor Detay Entegrasyonu | 2/2 | Complete   | 2026-03-02 | - |
