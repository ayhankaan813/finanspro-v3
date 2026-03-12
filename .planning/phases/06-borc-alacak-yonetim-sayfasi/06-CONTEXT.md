# Phase 6: Borç/Alacak Yönetim Sayfasi - Context (REVISED)

**Gathered:** 2026-03-01 (revised after UAT)
**Status:** Ready for replanning
**Source:** UAT feedback — original design was financier-only, user requires general-purpose tracking accounts

<domain>
## Phase Boundary

**CRITICAL DESIGN CHANGE:** Borc/Alacak sistemi sadece finansorler arasi DEGIL, tum entity tipleri arasinda calismali:
- Partner ↔ Dis Kisi (3. parti)
- Organizasyon ↔ Partner
- Finansor ↔ Partner
- Herhangi entity ↔ herhangi entity

Bu bir **izleme/takip hesabi** sistemidir — muhasebe programlarindaki gibi. Ornek: "Partner X, Dis Kisi Y'ye 5000 TL gonderdi — bunu takip et."

**Scope:** Backend schema degisikligi (Debt model polymorphic entity support) + Frontend sayfa yeniden yazimi

Requirements: PAGE-01 (ozet dashboard), PAGE-02 (acik borclar listesi), PAGE-03 (islem gecmisi), PAGE-04 (entity matrix)

**Backend Phase 5 durumu:** Mevcut Debt modeli `lender_id` ve `borrower_id` olarak sadece Financier FK'larina bagli. Bu degistirilmeli.
</domain>

<decisions>
## Implementation Decisions

### Entity Modeli (BLOCKER — Backend Degisikligi)
- Debt tablosuna `lender_type` ve `borrower_type` enum alanlari eklenmeli
- Entity tipleri: FINANCIER, PARTNER, EXTERNAL_PARTY, ORGANIZATION
- `lender_id` ve `borrower_id` generic UUID olarak kalmali (FK constraint kaldirilmali, uygulama seviyesinde dogrulama yapilmali)
- Service katmaninda entity lookup: type'a gore dogru tablodan isim/bilgi cekilmeli

### Sayfa Yapisi ve Organizasyon
- Sekmeli (Tabs) yapi korunacak: Ust kisimda ozet kartlari, altinda sekmeler
- Sayfa URL: `/borclar`
- Sidebar'da mevcut "Borc/Alacak" itemi korunacak

### Yeni Borc Dialog (DEGISTI)
- Ilk adim: "Borc Veren Tipi" secimi (Partner / Finansor / Dis Kisi / Organizasyon)
- Ikinci adim: Secilen tipe gore entity dropdown'u
- Ayni sekilde "Borc Alan" icin tip + entity secimi
- Ayni tip icerisinde ayni entity secilemez (ornek: ayni partner hem veren hem alan olamaz)
- Farkli tip entityler arasinda borc olabilir (ornek: Partner → Dis Kisi)

### Ozet Kartlari (PAGE-01)
- 4 kart korunacak: Toplam Borc, Toplam Alacak, Net Durum, Aktif Borc Sayisi
- API degisecek — artik tum entity tipleri icin aggregate

### Acik Borclar Listesi (PAGE-02)
- Tablo sutunlari: Borc Veren (tip + isim), Borc Alan (tip + isim), Baslangic Tutari, Kalan Bakiye, Tarih
- Filtreler: Entity tipi filtresi + Durum filtresi
- Entity tipi badge'leri ile gorsel ayrim (Finansor = mavi, Partner = yesil, Dis Kisi = turuncu, Org = mor)

### Islem Gecmisi (PAGE-03)
- Kronolojik tablo korunacak
- Entity tip badge'leri eklenmeli

### Entity Matrix Tablosu (PAGE-04 — DEGISTI)
- Artik "Finansor Matrix" degil, genel "Entity Matrix"
- Entity tip filtresi ile daraltilabilir (tum, sadece finansorler, sadece partnerler, vs.)
- Veya tum entityler tek tabloda (buyukse filtreleme ile)

### Borc Detay ve Aksiyonlar
- Expandable row korunacak
- Odeme ve iptal ayni sekilde calisacak
- Entity ismi + tipi gosterilecek

### Claude's Discretion
- Entity tip ikonlari ve renkleri
- Polymorphic entity lookup stratejisi (Prisma union query vs application-level)
- Matrix boyutu buyurse pagination/filtering stratejisi
- Loading skeleton tasarimi
- Responsive davranis

</decisions>

<specifics>
## Specific Ideas

- Header stili mevcut: `from-slate-900 to-slate-800` gradient
- Entity tipi badge renkleri: Finansor=#2a6f97, Partner=#059669, DisKisi=#d97706, Org=#7c3aed
- Dialog'da entity tipi secildikten sonra ilgili entity listesi yuklenmeli (lazy load)
- Matrix'te cok fazla entity varsa filter zorunlu olabilir

</specifics>

<code_context>
## Existing Code — What Changes

### Backend (DEGISECEK)
- `prisma/schema.prisma`: Debt modeli — lender/borrower FK Financier'dan kopacak, type enum eklenecek
- `modules/debt/debt.service.ts`: Entity lookup polymorphic olacak
- `modules/debt/debt.schema.ts`: lender_type/borrower_type validation eklenecek
- `modules/debt/debt.routes.ts`: Endpoint'ler guncellenecek

### Frontend (DEGISECEK)
- `hooks/use-api.ts`: Debt hook'lari ve interfaceler guncellenecek
- `app/(dashboard)/borclar/page.tsx`: Tamamen yeniden yazilacak

### Frontend (KORUNACAK)
- `components/layout/sidebar.tsx`: "Borc/Alacak" menu itemi mevcut ve dogru
- Tum UI component'ler (Card, Table, Tabs, Dialog, Badge, etc.) korunacak

### Mevcut Backend Entity Endpoint'leri (okuma icin)
- `GET /api/financiers` → Finansor listesi
- `GET /api/partners` → Partner listesi
- `GET /api/external-parties` → Dis kisi listesi
- Organization tekil (id config'den gelir)

</code_context>

<deferred>
## Deferred Ideas

- Finansor detay sayfasindan borc entegrasyonu — Phase 7
- Borc PDF export — Future
- Borc vade analizi — Future
- Faiz/komisyon hesaplama — Out of scope

</deferred>

---

*Phase: 06-borc-alacak-yonetim-sayfasi*
*Context gathered: 2026-03-01 (revised after UAT — entity scope expanded)*
