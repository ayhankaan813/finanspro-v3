# FinansPro v3 — Kasalar Arası Borç/Alacak Sistemi

## What This Is

FinansPro v3'e finansörler (kasalar) arası borç verme ve alacak takip sistemi eklenmesi. Finansörler birbirlerine borç verebilir, borç alabilir, serbest geri ödeme yapabilir. Tüm borç/alacak durumu dedike bir sayfada ve finansör detay sayfasında takip edilir.

## Core Value

Finansörler arası borç/alacak ilişkisi her an net görünsün — kim kime ne kadar borçlu, toplam açık borç ne kadar, hangi ödemeler yapılmış.

## Current Milestone: v1.1 Kasalar Arası Borç/Alacak

**Goal:** Finansörler birbirlerine borç verebilsin, geri ödeme yapabilsin, tüm borç/alacak durumu takip edilebilsin.

**Target features:**
- Borç verme/alma işlemi oluşturma (onaysız, admin direkt)
- Serbest geri ödeme (parça parça, istediği zaman)
- Borç/Alacak yönetim sayfası (özet, geçmiş, açık borçlar, çapraz tablo)
- Finansör detay sayfasında borç/alacak özet kartı ve tab'ı

## Requirements

### Validated

- ✓ Finansör CRUD (liste, detay, oluşturma, düzenleme) — existing
- ✓ Finansör detay sayfası (tab yapısı, istatistikler) — existing
- ✓ Double-entry muhasebe sistemi (ledger) — existing
- ✓ Finansör bakiye takibi — existing
- ✓ Dashboard layout (sidebar + responsive) — existing
- ✓ Rapor sayfaları (kasa-raporu, mutabakat, analiz) — existing

### Active

- [ ] Finansörler arası borç verme/alma işlemi oluşturulabilmeli
- [ ] Borç serbest geri ödeme ile kapatılabilmeli (parça parça veya tek seferde)
- [ ] Borç/Alacak yönetim sayfası — tüm borçların özeti
- [ ] İşlem geçmişi — kim kime ne zaman ne kadar verdi/ödedi
- [ ] Açık borçlar listesi — henüz kapanmamış borçlar, kalan tutar
- [ ] Finansör çapraz tablosu — matrix şeklinde kimin kime borçlu olduğu
- [ ] Finansör detay sayfasında borç/alacak özet kartı
- [ ] Finansör detay sayfasında Borç/Alacak tab'ı (ilgili finansörün borç detayları)

### Out of Scope

- Faiz/komisyon hesaplama — sadece anapara takibi, faiz yok
- Onay mekanizması — admin direkt işlem yapar
- Ledger entegrasyonu — borç/alacak ayrı tabloda takip edilir, mevcut muhasebe dışında
- Taksit planı — serbest ödeme, sabit taksit zorunluluğu yok
- Partner/site arası borç — sadece finansörler arası

## Context

- Mevcut finansör sistemi çalışıyor (CRUD, detay sayfası, tab'lar, istatistikler)
- Prisma ORM ile yeni tablo(lar) eklenecek — `Debt`, `DebtPayment` gibi
- Frontend: Next.js 15 App Router + React Query + shadcn/ui
- Borç işlemleri mevcut ledger'dan bağımsız, ayrı tablo ile takip
- Mevcut finansör detay sayfasına yeni kart ve tab eklenmesi gerekecek
- Örnek senaryo: Yağız (finansör) Toprak'tan (finansör) 10.000 TL borç alıyor → serbest geri ödüyor

## Constraints

- **Tech stack**: Mevcut stack (Fastify + Prisma + Next.js) — yeni paket eklenmeyecek
- **Muhasebe**: Borç/alacak ledger'a yansımayacak, ayrı tablo
- **Faiz**: Faiz hesaplama yok, sadece anapara
- **Onay**: Onay mekanizması yok, admin direkt işler

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ledger dışında ayrı tablo | Borç/alacak mevcut komisyonlu işlemlerden farklı kavram | — Pending |
| Faiz yok | İlk versiyonda karmaşıklık eklememek | — Pending |
| Onay yok | Admin tek kullanıcı, onay gereksiz | — Pending |
| Serbest geri ödeme | Taksit planı gereksiz karmaşıklık | — Pending |
| Responsive milestone durduruldu | Borç/alacak öncelikli | — Pending |

---
*Last updated: 2026-02-28 after milestone v1.1 initialization*
