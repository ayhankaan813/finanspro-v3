# 💼 FinansPro v3

> Modern, güvenli ve ölçeklenebilir finansal yönetim platformu

**Versiyon:** 3.1.0
**Son Güncelleme:** 11 Şubat 2026
**Durum:** ✅ Production Ready (Test Aşamasında)

---

## 🎯 Proje Hakkında

FinansPro v3, site, partner, financier ve organization arasındaki finansal akışları yöneten, **double-entry muhasebe sistemi** ile desteklenen bir SaaS platformudur.

### Temel Özellikler

- ✅ **Double-Entry Accounting:** Her işlem dengeli muhasebe kaydı
- ✅ **Komisyon Yönetimi:** Otomatik komisyon hesaplama ve dağılımı
- ✅ **Çok Taraflı Sistem:** Site, Partner, Finansör, Organizasyon
- ✅ **Gerçek Zamanlı Raporlama:** Dashboard ve detaylı raporlar
- ✅ **Decimal Precision:** Finansal hesaplamalarda %100 doğruluk
- ✅ **Modern UI/UX:** Next.js 15 + Tailwind CSS + shadcn/ui

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Node.js** 18+
- **PostgreSQL** 17
- **pnpm** 8+

### Kurulum

```bash
# 1. Bağımlılıkları yükle
pnpm install

# 2. PostgreSQL'i başlat (Docker)
docker run --name finanspro-db \
  -e POSTGRES_PASSWORD=finanspro_v3_secure_password \
  -e POSTGRES_USER=finanspro_v3 \
  -e POSTGRES_DB=finanspro_v3 \
  -p 5432:5432 \
  -d postgres:17

# 3. Database'i hazırla
cd apps/backend
npx prisma db push
node --import tsx prisma/seed.ts

# 4. Backend'i başlat (Terminal 1)
cd apps/backend
npm run dev
# http://localhost:3001

# 5. Frontend'i başlat (Terminal 2)
cd apps/frontend
npm run dev
# http://localhost:3000
```

### Giriş Bilgileri

```
Email: admin@finanspro.com
Şifre: admin123
```

---

## 📁 Proje Yapısı

```
finanspro-v3/
├── apps/
│   ├── backend/          # Fastify + Prisma + PostgreSQL
│   └── frontend/         # Next.js 15 + React Query + Tailwind
├── packages/
│   └── shared/           # Shared types and constants
├── .claude/              # Claude Code customizations
│   ├── commands/         # Custom slash commands
│   ├── skills/           # Domain knowledge
│   └── CLAUDE.md         # Comprehensive project guide
├── ROADMAP.md            # Development roadmap & changelog
└── README.md             # This file
```

---

## 🏗️ Teknoloji Stack

### Backend
- **Framework:** Fastify 5
- **ORM:** Prisma 6
- **Database:** PostgreSQL 17
- **Runtime:** Node.js 18+ with tsx
- **Validation:** Zod schemas
- **Financial:** Decimal.js (precision guaranteed)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **State:** React Query + Zustand
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **UI Components:** Radix UI + shadcn/ui

---

## 💡 Temel Kavramlar

### Komisyon Yapısı (

**Örnek:** 100 TL işlem
- Site: 6 TL komisyon
- Partner: 1.5 TL
- Finansör: 2.5 TL (OTOMATIK KESİLİR - deftere girmez)
- Organizasyon: 2 TL
- **Muhasebeleştirilen:** 97.5 TL (100 - 2.5 finansör kesintisi)

### Double-Entry Accounting

**Altın Kural:** Her işlem dengeli ledger kaydı oluşturur

```
TOPLAM BORÇ (DEBIT) = TOPLAM ALACAK (CREDIT)
```

**Örnek Yatırım İşlemi (100 TL):**
```
BORÇ (DEBIT):
  Finansör     +97.5 TL (finansörde duran para - AKTİF)

ALACAK (CREDIT):
  Site         +94.0 TL (müşterilere borç - BORÇ HESABI)
  Partner      +1.5 TL  (komisyon borcu - BORÇ HESABI)
  Organizasyon +2.0 TL  (bizim kar - AKTİF)

Toplam: 97.5 = 94 + 1.5 + 2 ✅ DENGELİ
```

---

## 🎨 Tasarım Sistemi

### Renk Paleti - Deep Space Blue

```css
--deep-space-blue: #012a4a;    /* Dark base */
--yale-blue: #013a63;          /* Primary */
--rich-cerulean: #2a6f97;      /* Secondary */
--cerulean: #2c7da0;           /* Accent */
--steel-blue: #61a5c2;         /* Muted */
--light-blue: #a9d6e5;         /* Background */
```

### Tasarım Prensipleri (2026 Modern UI)

- ✨ Card-based layouts (`rounded-3xl`)
- 🌊 Generous whitespace
- 🎭 Subtle shadows (`shadow-lg`, `shadow-xl`)
- 🌈 Gradient backgrounds
- 🎬 Smooth transitions (300ms ease)
- 🎯 Icon + Text combinations
- 📱 Responsive grid layouts
- 📊 Data visualization with charts

---

## 📚 Dökümanlar

- **[ROADMAP.md](./ROADMAP.md)** - Detaylı geliştirme planı, değişiklikler, yapılacaklar
- **[.claude/CLAUDE.md](./.claude/CLAUDE.md)** - Kapsamlı proje rehberi (CEO-CFO modeli)
- **[API Docs](http://localhost:3001/docs)** - Swagger/OpenAPI documentation

---

## 🔧 Geliştirme

### Önemli Komutlar

```bash
# Backend
cd apps/backend
npm run dev          # Development server
npm run build        # Production build
npx prisma studio    # Database GUI
npx prisma migrate dev  # Create migration

# Frontend
cd apps/frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
```

### Custom Slash Commands

```bash
/audit              # Finansal doğruluk kontrolü
/financial-test     # E2E test seed data ile
/deploy-check       # Production hazırlık kontrolü
/optimize           # Performans analizi
```

---

## 🧪 Test

### Manuel Test

```bash
# 1. Sistemi başlat (yukardaki adımlar)
# 2. Tarayıcıda aç: http://localhost:3000
# 3. Giriş yap: admin@finanspro.com / admin123
# 4. Test senaryolarını takip et
```

### Test Edilmesi Gerekenler

1. **Yatırım İşlemi (100 TL)**
   - Site bakiyesi: +94 TL
   - Partner bakiyesi: +1.5 TL
   - Finansör bakiyesi: +97.5 TL
   - Org bakiyesi: +2 TL
   - Ledger dengeli mi?

2. **Komisyon Validasyonu**
   - Aşırı komisyon girilince hata vermeli
   - Negatif organizasyon karı engellenmeli

3. **UI/UX Akışı**
   - Tüm sayfalar açılıyor mu?
   - Veriler doğru görünüyor mu?
   - Loading states çalışıyor mu?

---

## 🚨 Bilinen Sorunlar

### Next.js Vendor Chunk Hatası
**Durum:** ⚠️ Düşük öncelik
**Etki:** Console'da hata görünüyor ama sayfa çalışıyor
**Geçici Çözüm:** `cd apps/frontend && rm -rf .next && npm run dev`

Detaylar için: [ROADMAP.md - Bilinen Sorunlar](./ROADMAP.md#-bilinen-sorunlar-ve-çözümler)

---

## 🤝 Katkıda Bulunma

Bu proje aktif geliştirme aşamasında. Katkıda bulunmak için:

1. Issue aç (bug report veya feature request)
2. Fork & branch oluştur
3. Değişiklikleri yap
4. Pull request gönder

---

## 📊 Proje İstatistikleri

```
Backend:
  ├─ API Endpoints: 60+
  ├─ Database Tables: 15
  ├─ Services: 8
  └─ Lines of Code: ~10,000

Frontend:
  ├─ Pages: 20+
  ├─ Components: 60+
  ├─ Hooks: 30+
  └─ Lines of Code: ~15,000

Total: ~25,000 lines of TypeScript
```

---

## 🎯 Yol Haritası

### ✅ Tamamlandı (v3.1.0)
- Muhasebe sistemi düzeltmesi
- Komisyon validasyonu
- Modern UI/UX
- Double-entry accounting
- Decimal precision

### 🚧 Devam Ediyor (v3.2.0)
- Manuel test completion
- Performance optimization
- Error handling improvements
- Test coverage artırma

### 📋 Planlanan (v3.3.0+)
- Multi-tenant support
- Excel/PDF export
- Email/SMS notifications
- Mobile app
- Advanced analytics
- AI-powered insights

Detaylı yol haritası: [ROADMAP.md](./ROADMAP.md)

---

## 📞 Destek

- **Teknik Sorular:** [ROADMAP.md - Destek](./ROADMAP.md#-destek)
- **Proje Rehberi:** [.claude/CLAUDE.md](./.claude/CLAUDE.md)
- **API Docs:** http://localhost:3001/docs

---

## 📜 Lisans

Proprietary - ©2026 FinansPro

---


---

**Son Güncelleme:** 11 Şubat 2026
**Versiyon:** 3.1.0
**Durum:** ✅ Test Edilmeye Hazır

🚀 **Happy Coding!**
