# FinansPro v3 — Mobile Responsive Overhaul

## What This Is

FinansPro v3'un tum frontend sayfalarini (dashboard, site detay, partner, finansor, dis kisiler, raporlar, ayarlar, onaylar, islemler) mobil ve tablet ekranlarda duzenli gorunecek sekilde responsive hale getirmek. Mevcut tasarim korunacak, sadece mobil uyumluluk eklenecek.

## Core Value

Hicbir sayfada icerik tasmamali, tablo kirilmamali, yazi kesilmemeli — 375px genislikten itibaren her sey okunaklı ve kullanilabilir olmali.

## Requirements

### Validated

- ✓ Dashboard layout (sidebar + main content) — existing
- ✓ Hamburger menu (mobil sidebar toggle) — existing, working
- ✓ Temel responsive padding (`container px-3 py-1 sm:py-6 lg:px-8`) — existing in layout
- ✓ Rapor sayfalari (kasa-raporu, mutabakat, analiz) dark mode + responsive header — existing

### Active

- [ ] Tum sayfalarda tasan icerik duzeltilmeli (overflow-x: hidden + uygun wrapping)
- [ ] Tablolar mobilde yatay scroll ile goruntulenebilmeli
- [ ] Kartlar responsive grid'e gecmeli (mobilde tek sutun, tablette iki, masaustunde uc+)
- [ ] Finansal rakamlar (bakiye, komisyon) mobilde kesilmeden gorunmeli
- [ ] Form diyaloglari mobil ekranda duzenli gorunmeli
- [ ] Chart/grafik alanlari mobil ekrana sigmali
- [ ] Site detay sayfalari (tabs, istatistikler) mobilde kullanilabilir olmali
- [ ] Partner/Finansor detay sayfalari mobil uyumlu olmali
- [ ] Dis kisi detay sayfasi (ekran goruntusundeki gibi) mobilde duzeltilmeli
- [ ] Islem tablosu sayfasi mobil uyumlu olmali
- [ ] Onay sayfasi mobil uyumlu olmali
- [ ] Ayarlar sayfasi mobil uyumlu olmali
- [ ] Organization analitik sayfasi + alt sayfalari mobil uyumlu olmali
- [ ] 375px (telefon) ve 768px (tablet) icin breakpoint'ler ayarlanmali

### Out of Scope

- Tasarim degisikligi — mevcut renk paleti, font, karti aynen korunacak
- Yeni ozellik ekleme — sadece mevcut icerigin responsive yapilmasi
- Backend degisiklikleri — tamamen frontend calismasi
- PWA veya mobil app — sadece responsive web

## Context

- Proje: Next.js 15 (App Router) + Tailwind CSS 3.4.1 + shadcn/ui + Radix UI
- 20+ sayfa mevcut (dashboard, site/partner/finansor listeler + detaylar, raporlar, ayarlar, islemler, onaylar)
- Layout zaten `lg:pl-64` ile sidebar offset'i kullaniyor
- Bazi sayfalar kismi responsive (raporlar), cogu degil
- Ekran goruntusundeki sorun: kartlardaki rakamlar tasiyor, tablo sutunlari dar ekrana sigmiyor
- Sidebar zaten hamburger menuyle calisiyor

## Constraints

- **Tech stack**: Sadece Tailwind CSS siniflari — yeni paket eklenmeyecek
- **Korunacak**: Mevcut tasarim, renk paleti, komponent yapisi bozulmayacak
- **Breakpoints**: 375px (sm-), 640px (sm), 768px (md), 1024px (lg) — Tailwind defaults
- **Test**: Her sayfa mobil + tablet + masaustu gorunumde kontrol edilmeli

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tablolar yatay scroll | Kullanici istegi, veri kaybini onler | — Pending |
| Mevcut tasarim korunacak | Kullanici istegi, hizli teslim | — Pending |
| Sadece Tailwind siniflari | Yeni dependency eklememek, proje tutarliligi | — Pending |

---
*Last updated: 2026-02-28 after initialization*
