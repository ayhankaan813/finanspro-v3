# FinansPro v3

> Modern, guvenli ve olceklenebilir finansal yonetim platformu

**Versiyon:** 3.2.0
**Son Guncelleme:** 22 Subat 2026
**Durum:** Aktif Gelistirme

---

## Proje Hakkinda

FinansPro v3, site, partner, finansor ve organizasyon arasindaki finansal akislari yoneten, **double-entry muhasebe sistemi** ile desteklenen bir SaaS platformudur.

### Temel Ozellikler

- **Double-Entry Accounting:** Her islem dengeli muhasebe kaydi
- **Komisyon Yonetimi:** Otomatik komisyon hesaplama ve dagilimi
- **Cok Tarafli Sistem:** Site, Partner, Finansor, Organizasyon, Dis Kisiler
- **Gercek Zamanli Raporlama:** Dashboard, kasa raporu, mutabakat, analiz
- **Decimal Precision:** Finansal hesaplamalarda %100 dogruluk (Decimal.js)
- **Islem Onay Sistemi:** Role-based approval workflow
- **Bildirim Sistemi:** Panel ici bildirimler
- **Mobil Uyumlu:** Responsive tasarim, tum cihazlarda calisiyor

---

## Hizli Baslangic

### Gereksinimler

- **Node.js** 18+
- **PostgreSQL** 17
- **pnpm** 8+

### Kurulum

```bash
# 1. Bagimliliklari yukle
pnpm install

# 2. PostgreSQL'i baslat (Docker)
docker run --name finanspro-db \
  -e POSTGRES_PASSWORD=finanspro_v3_secure_password \
  -e POSTGRES_USER=finanspro_v3 \
  -e POSTGRES_DB=finanspro_v3 \
  -p 5432:5432 \
  -d postgres:17

# 3. Database'i hazirla
cd apps/backend
npx prisma db push
node --import tsx prisma/seed.ts

# 4. Backend'i baslat (Terminal 1)
cd apps/backend
npm run dev
# http://localhost:3001

# 5. Frontend'i baslat (Terminal 2)
cd apps/frontend
npm run dev
# http://localhost:3000
```

### Giris Bilgileri

```
Email: admin@finanspro.com
Sifre: admin123
```

---

## Proje Yapisi

```
finanspro-v3/
├── apps/
│   ├── backend/                 # Fastify + Prisma + PostgreSQL
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── approval/        # Islem onay workflow
│   │   │   │   ├── auth/            # JWT authentication
│   │   │   │   ├── balance/         # Bakiye hesaplama
│   │   │   │   ├── external-party/  # Dis kisi yonetimi
│   │   │   │   ├── financier/       # Finansor yonetimi
│   │   │   │   ├── ledger/          # Muhasebe defteri
│   │   │   │   ├── notification/    # Bildirim sistemi
│   │   │   │   ├── organization/    # Organizasyon yonetimi
│   │   │   │   ├── partner/         # Partner yonetimi
│   │   │   │   ├── personnel/       # Personel & maas takibi
│   │   │   │   ├── report/          # Rapor uretimi
│   │   │   │   ├── settings/        # Komisyon oranlari & ayarlar
│   │   │   │   ├── site/            # Site yonetimi
│   │   │   │   └── transaction/     # Islem & komisyon
│   │   │   └── shared/              # Prisma client, logger, audit
│   │   └── prisma/                  # Database schema & seed
│   │
│   └── frontend/                # Next.js 15 + React Query + Tailwind
│       └── src/
│           ├── app/(dashboard)/
│           │   ├── dashboard/
│           │   ├── transactions/       # Islem listesi + bulk import
│           │   ├── sites/              # Site listesi + detay
│           │   ├── partners/           # Partner listesi + detay
│           │   ├── financiers/         # Finansor listesi + detay
│           │   ├── external-parties/   # Dis kisi listesi + detay
│           │   ├── organization/       # Org yonetimi + personel
│           │   ├── reports/
│           │   │   ├── kasa-raporu/        # Kasa raporu
│           │   │   ├── reconciliation/    # Mutabakat raporu
│           │   │   ├── analysis/          # Finansal analiz
│           │   │   ├── daily/             # Gunluk rapor
│           │   │   └── monthly/           # Aylik rapor
│           │   ├── approvals/          # Onay bekleyenler
│           │   └── settings/           # Ayarlar
│           ├── components/
│           ├── hooks/                  # React Query hooks
│           └── lib/                    # API client, utils
│
├── packages/
│   └── shared/                  # Shared types
│
└── .claude/                     # Claude Code customizations
    ├── commands/                # /audit, /financial-test, /deploy-check, /optimize
    ├── skills/                  # finanspro-accounting, finanspro-testing
    └── agents/                  # financial-audit-team (3-teammate)
```

---

## Teknoloji Stack

### Backend
- **Framework:** Fastify 4
- **ORM:** Prisma 6
- **Database:** PostgreSQL 17
- **Runtime:** Node.js 18+ with tsx
- **Validation:** Zod schemas
- **Financial:** Decimal.js (precision guaranteed)
- **Logging:** Pino

### Frontend
- **Framework:** Next.js 15 (App Router)
- **State:** React Query (TanStack Query) + Zustand
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **UI Components:** Radix UI + shadcn/ui
- **Animation:** Framer Motion

---

## Temel Kavramlar

### Komisyon Yapisi

```
Site:         6%     (musteri komisyonu)
Partner:      1.5%   (partner hak edisi)
Finansor:     2.5%   (finansor komisyonu - otomatik kesilir)
Organizasyon: 2%     (organizasyon kari)
Toplam:       12%
```

**Ornek:** 100 TL islem
- Finansor 2.5 TL otomatik keser (deftere girmez)
- Muhasbeleistirilen: 97.5 TL
- Site: 94 TL, Partner: 1.5 TL, Organizasyon: 2 TL

### Double-Entry Accounting

Her islem dengeli ledger kaydi olusturur: `DEBIT = CREDIT`

```
100 TL Yatirim:
  DEBIT:  Finansor     +97.5 TL  (ASSET)
  CREDIT: Site         +94.0 TL  (LIABILITY)
  CREDIT: Partner      +1.5 TL   (LIABILITY)
  CREDIT: Organizasyon +2.0 TL   (ASSET)
  Toplam: 97.5 = 94 + 1.5 + 2 (DENGELI)
```

### Hesap Tipleri

| Hesap | Tip | Aciklama |
|-------|-----|----------|
| Finansor | ASSET | Bizim icin para tutuyor |
| Organizasyon | ASSET | Bizim kar/sermaye |
| Site | LIABILITY | Musterilere borc |
| Partner | LIABILITY | Komisyon borcu |
| Dis Kisi | LIABILITY | Dis borc |

---

## Sayfalar

### Dashboard ve Islemler
| Sayfa | Yol | Aciklama |
|-------|-----|----------|
| Dashboard | `/dashboard` | Genel bakis, ozet istatistikler |
| Tum Islemler | `/transactions` | Islem listesi, filtreleme, arama |
| Bulk Import | `/transactions/import` | Toplu islem aktarimi |

### Hesaplar
| Sayfa | Yol | Aciklama |
|-------|-----|----------|
| Organizasyon | `/organization` | Org bakiyesi, analytics |
| Personel | `/organization/personnel` | Personel & maas takibi |
| Siteler | `/sites` | Site listesi + detay |
| Partnerler | `/partners` | Partner listesi + detay |
| Finansorler | `/financiers` | Finansor listesi + detay |
| Dis Kisiler | `/external-parties` | Dis kisi listesi + detay |

### Raporlar
| Sayfa | Yol | Aciklama |
|-------|-----|----------|
| Kasa Raporu | `/reports/kasa-raporu` | Aylik/gunluk kasa ozeti |
| Mutabakat | `/reports/reconciliation` | Varlik-yukumluluk dengesi |
| Analiz | `/reports/analysis` | Performans ve dagilim |

### Sistem
| Sayfa | Yol | Aciklama |
|-------|-----|----------|
| Onay Bekleyenler | `/approvals` | Pending islem onay kuyrugu |
| Ayarlar | `/settings` | Komisyon oranlari, sistem ayarlari |

---

## Gelistirme

### Onemli Komutlar

```bash
# Backend
cd apps/backend
npm run dev              # Development server (localhost:3001)
npm run build            # Production build
npx prisma studio        # Database GUI
npx prisma db push       # Schema push

# Frontend
cd apps/frontend
npm run dev              # Development server (localhost:3000)
npm run build            # Production build
npx tsc --noEmit         # Type check
```

### Claude Code Komutlari

```bash
/audit              # Finansal dogruluk kontrolu
/financial-audit    # 3-teammate ile kapsamli audit
/financial-test     # E2E test seed data ile
/deploy-check       # Production hazirlik kontrolu
/optimize           # Performans analizi
```

---

## Proje Istatistikleri

```
Backend:
  API Endpoints: 70+
  Database Tables: 15+
  Modules: 14
  Lines of Code: ~12,000

Frontend:
  Pages: 22+
  Components: 70+
  Hooks: 35+
  Lines of Code: ~18,000

Total: ~30,000 lines of TypeScript
```

---

## Yol Haritasi

### Tamamlandi (v3.0 - v3.2)
- Muhasebe sistemi (double-entry, Decimal.js)
- Komisyon validasyonu
- Islem onay & bildirim sistemi
- Personel yonetimi
- Dis kisi yonetimi (detay + kasa defteri)
- Bulk import
- Kasa raporu, mutabakat, analiz raporlari
- Mobil optimizasyon
- Turkey timezone (GMT+3)
- Admin transaction edit (Undo & Recreate)

### Devam Ediyor
- Test coverage artirma
- Performance optimization

### Planlanan
- Multi-tenant support
- Excel/PDF export
- Email/SMS notifications
- Mobile app

Detayli yol haritasi: [ROADMAP.md](./ROADMAP.md)

---

## Dokumanlar

- **[ROADMAP.md](./ROADMAP.md)** - Detayli gelistirme plani
- **[CHANGELOG.md](./CHANGELOG.md)** - Versiyon gecmisi
- **[API Docs](http://localhost:3001/docs)** - Swagger/OpenAPI
- **[.claude/](./.claude/)** - Claude Code customizations

---

## Lisans

Proprietary - 2026 FinansPro

---

**Son Guncelleme:** 22 Subat 2026
**Versiyon:** 3.2.0
