# Requirements: FinansPro v3 — Mobile Responsive Overhaul

**Defined:** 2026-02-28
**Core Value:** Hicbir sayfada icerik tasmamali, tablo kirilmamali, yazi kesilmemeli — 375px'ten itibaren her sey okunakli ve kullanilabilir olmali.

## v1 Requirements

Requirements for mobile responsive overhaul. Each maps to roadmap phases.

### Global Foundation

- [ ] **GLOB-01**: Layout root overflow-x: clip uygulanmali (sticky pozisyonu bozmadan tasan icerigi onler)
- [ ] **GLOB-02**: Tum input/select/textarea elementleri 16px font-size kullanmali (iOS Safari zoom onleme)
- [ ] **GLOB-03**: Tum interaktif elementler (buton, tab, satir) minimum 44px touch target olmali
- [ ] **GLOB-04**: shadcn Dialog komponenti mobilde w-full max-w-lg max-h-[90vh] overflow-y-auto olmali
- [ ] **GLOB-05**: Finansal rakamlar whitespace-nowrap ile korunmali, sayi ortasindan kirilmamali

### Tablolar

- [ ] **TABL-01**: Tum tablo elementleri overflow-x-auto wrapper icinde olmali (~15 tablo)
- [ ] **TABL-02**: Tablo wrapper'lari mobilde -mx-3 sm:mx-0 ile kenardan kenara scroll alani saglamali
- [ ] **TABL-03**: Tablo hucreleri whitespace-nowrap ile icerik kirilmasini onlemeli

### Kart Grids

- [ ] **GRID-01**: Dashboard kartlari grid-cols-1 sm:grid-cols-2 lg:grid-cols-3+ responsive grid kullanmali
- [ ] **GRID-02**: Site listesi kartlari mobilde tek sutun, tablette iki sutun gorunmeli
- [ ] **GRID-03**: Partner listesi kartlari mobilde tek sutun, tablette iki sutun gorunmeli
- [ ] **GRID-04**: Finansor listesi kartlari mobilde tek sutun, tablette iki sutun gorunmeli
- [ ] **GRID-05**: Dis kisi listesi kartlari mobilde responsive grid kullanmali

### Detay Sayfalari

- [ ] **DETL-01**: Site detay sayfasi (/sites/[id]) — istatistik kartlari, tablar ve tablo mobilde duzgun gorunmeli
- [ ] **DETL-02**: Partner detay sayfasi (/partners/[id]) — kart ve tablo icerigi mobilde tasmamali
- [ ] **DETL-03**: Finansor detay sayfasi (/financiers/[id]) — bakiye kartlari ve islem tablosu responsive olmali
- [ ] **DETL-04**: Dis kisi detay sayfasi (/external-parties/[id]) — ekran goruntusundeki tasan icerik duzeltilmeli
- [ ] **DETL-05**: shadcn Tabs componentleri mobilde ScrollArea ile yatay scroll desteklemeli

### Islem ve Onay Sayfalari

- [ ] **TXNP-01**: Islem listesi sayfasi (/transactions) — filtre + tablo mobilde kullanilabilir olmali
- [ ] **TXNP-02**: Onay sayfasi (/approvals) — onay tablosu ve aksiyon butonlari mobilde erisilebilir olmali

### Organization

- [ ] **ORGN-01**: Organization ana sayfasi (/organization) — analitik kartlar ve grafikler responsive olmali
- [ ] **ORGN-02**: Site karlilik sayfasi (/organization/site-profitability) — tablo ve kartlar mobil uyumlu olmali
- [ ] **ORGN-03**: Personel sayfasi (/organization/personnel) — liste ve detaylar mobilde duzgun gorunmeli

### Raporlar

- [ ] **REPT-01**: Gunluk rapor sayfasi (/reports/daily) — mobilde icerik goruntulenebilir olmali
- [ ] **REPT-02**: Aylik rapor sayfasi (/reports/monthly) — mobilde icerik goruntulenebilir olmali
- [ ] **REPT-03**: Kasa raporu, mutabakat ve analiz sayfalari 375px'te dogrulanmali

### Ayarlar

- [ ] **SETT-01**: Ayarlar sayfasi (/settings) — tab navigasyonu ve form alanlari mobilde kullanilabilir olmali

### Compact Number Format

- [ ] **CMPN-01**: formatMoney utility'sine compact secenegi eklenmeli (1.250.000 → 1,25M)
- [ ] **CMPN-02**: Dashboard kartlarinda compact format kullanilmali (tam deger tooltip'te)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Mobile UX

- **EMUX-01**: Tablolarda sticky first column (CSS position: sticky)
- **EMUX-02**: Islem sayfasinda collapsible filter panel
- **EMUX-03**: Column priority hiding (sm: altinda dusuk oncelikli sutunlari gizle)
- **EMUX-04**: Mobil sticky CTA bar (alt kisimda sabit aksiyon butonu)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Card view tablo donusumu | Finansal veri karsilastirmasini bozar, cift rendering path karmasikligi |
| Pull-to-refresh | iOS PWA uyumsuzlugu, React Query zaten veri tazeligi saglar |
| Bottom navigation bar | 10+ bolum var, bottom nav max 5 destekler, IA yeniden tasarimi gerekir |
| Swipe gestures | iOS Safari geri hareketi ile carpisir, finansal islemler acik onay ister |
| Ayri mobil sayfa/route | Bakim yukunu ikiye katlar, her yeni ozellik iki kez yazilir |
| Offline mode / PWA | Finansal veri gercek zamanli olmali, eski cache guven sorunu yaratir |
| Tasarim degisikligi | Mevcut renk paleti, font, kart yapisi korunacak |
| Backend degisiklikleri | Tamamen frontend calismasi |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GLOB-01 | — | Pending |
| GLOB-02 | — | Pending |
| GLOB-03 | — | Pending |
| GLOB-04 | — | Pending |
| GLOB-05 | — | Pending |
| TABL-01 | — | Pending |
| TABL-02 | — | Pending |
| TABL-03 | — | Pending |
| GRID-01 | — | Pending |
| GRID-02 | — | Pending |
| GRID-03 | — | Pending |
| GRID-04 | — | Pending |
| GRID-05 | — | Pending |
| DETL-01 | — | Pending |
| DETL-02 | — | Pending |
| DETL-03 | — | Pending |
| DETL-04 | — | Pending |
| DETL-05 | — | Pending |
| TXNP-01 | — | Pending |
| TXNP-02 | — | Pending |
| ORGN-01 | — | Pending |
| ORGN-02 | — | Pending |
| ORGN-03 | — | Pending |
| REPT-01 | — | Pending |
| REPT-02 | — | Pending |
| REPT-03 | — | Pending |
| SETT-01 | — | Pending |
| CMPN-01 | — | Pending |
| CMPN-02 | — | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29 (pending roadmap creation)

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after initial definition*
