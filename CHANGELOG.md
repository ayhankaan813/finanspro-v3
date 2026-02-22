# FinansPro v3 - Changelog

**Format:** [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
**Versiyonlama:** [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Planlanan
- Unit test coverage (hedef: %80)
- Tum sayfalar dark mode
- Excel/PDF export

---

## [3.2.0] - 2026-02-22 - UI Redesign & Mobile Optimization

### Added
- **Kasa Raporu sayfasi** (`/reports/kasa-raporu`) - Aylik/gunluk kasa ozet raporu
- **Dis Kisi detay sayfasi** (`/external-parties/[id]`) - Borc takibi + kasa defteri
- **Personel modulu** (`/organization/personnel`) - Maas ve avans takibi
- **Report modulu** (backend) - Rapor uretimi servisi
- **Denge cubugu** - Mutabakat sayfasinda varlik vs yukumluluk gorseli
- **Organizasyon bakiyesi** - Mutabakat sayfasinda org hesabi yukumluluklere dahil
- **Turkey timezone (GMT+3)** - Tum tarih gosterimleri Turkiye saatine gore

### Changed
- **Mutabakat sayfasi yeniden tasarim** - Dark mode, mobil uyumlu, org bakiyesi eklendi, YZ analiz karti kaldirildi
- **Analiz sayfasi yeniden tasarim** - Dark mode, mobil uyumlu, tutarli header, gereksiz API cagrilari kaldirildi
- **Finansor/Partner/Site detay sayfalari** - Mobil optimize edildi
- **Sidebar** - Dis Kisiler ve yeni rapor sayfalari eklendi
- **Bulk Import sayfasi** - Custom dropdown'lar, sticky header, localStorage persistence
- **Sites sayfasi** - Dropdown menu, inactive styling, tarih filtresi

### Fixed
- **Webpack watchOptions** - Sayfa 404 hatalarina neden olan ayar kaldirildi
- **@fastify/compress** - Fastify 4.x uyumlulugu icin v7'ye downgrade
- **Next.js** - 15.0.0 → 15.0.8 upgrade (Node.js v24 uyumlulugu)
- **Bakiye hesaplamalari** - Site/partner/finansor istatistik endpoint'leri duzeltildi
- **Org dashboard** - Transaction filtreleri, aylik/gunluk rapor dogrulugu
- **Komisyon yuvarlamasi** - Tum tutarlar 2 ondalik basamaga yuvarlanarak ledger dengesizligi onlendi
- **Sidebar aktif durum** - Ayni anda birden fazla item'in highlight olmasi duzeltildi

### Performance
- **Webpack dev** - Derleme optimizasyonu, kullanilmayan paketler kaldirildi
- **Guvenlik** - Kapsamli security hardening
- **React Query cache** - Cache optimizasyonu

---

## [3.1.2] - 2026-02-11 - Bakiye Gosterim Duzeltmesi

### Fixed
- **Site bakiyeleri** - Tum sayfalardaki negatif gosterim duzeltildi
  - `sites/page.tsx` toplam bakiye ozeti
  - `sites/[id]/page.tsx` ana bakiye, aylik ve gunluk istatistikler
  - 4 farkli yerdeki yanlis isaret cevirme (-parseFloat) kaldirildi

---

## [3.1.1] - 2026-02-11 - Kismi Bakiye Duzeltmesi

### Fixed
- **Site kart bakiyesi** - Sadece liste kartlarinda duzeltildi (eksik - v3.1.2'de tamamlandi)

---

## [3.1.0] - 2026-02-11 - Kritik Muhasebe Duzeltmesi

### Fixed
- **Muhasebe mantigi** - Finansor komisyonu hesaplama tamamen yeniden yazildi
  - Finansor 2.5% komisyonu otomatik kesilir, deftere girmez
  - 97.5 TL basis kullanilir (100 TL degil)
  - Ledger dengesi: DEBIT = CREDIT her zaman
- **Hesap tipi siniflandirmasi** - Site artik LIABILITY (ASSET degil)
  - Site: CREDIT artirir, DEBIT azaltir
  - Finansor/Org: DEBIT artirir, CREDIT azaltir

### Added
- **Komisyon validasyonu** - Dagitimin site komisyonunu asmasi engellenir
- **Negatif kar kontrolu** - Org kari negatif cikamaz
- **Islem onay sistemi** - 14 islem tipine approval workflow
- **Bildirim sistemi** - Panel ici admin bildirimleri
- **Audit logging** - Tum onay/red islemleri loglaniyor
- **Admin transaction edit** - Undo & Recreate ledger stratejisi

---

## [3.0.0] - 2026-02-07 - Ilk Yayinlama

### Added
- Fastify backend + Prisma ORM + PostgreSQL
- Next.js 15 frontend (App Router)
- Site, Partner, Finansor, Organizasyon yonetimi
- Transaction processing + komisyon hesaplama
- Ledger sistemi (double-entry)
- JWT authentication + role-based access
- Dashboard, raporlar, analytics
- shadcn/ui + Tailwind CSS + Recharts

---

**Son Guncelleme:** 22 Subat 2026
