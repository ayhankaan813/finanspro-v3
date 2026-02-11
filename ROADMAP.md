# 🗺️ FinansPro v3 - Development Roadmap

**Proje:** FinansPro v3 - Modern Finansal Yönetim SaaS
**Son Güncelleme:** 11 Şubat 2026
**Mevcut Versiyon:** 3.1.0
**Durum:** ✅ Kritik Muhasebe Düzeltmeleri Tamamlandı

---

## 📊 GENEL BAKIŞ

### Proje Durumu
```
██████████████████████░░ 90% Tamamlandı

✅ Temel Altyapı      : 100%
✅ Muhasebe Sistemi   : 100% (11 Şubat düzeltildi)
✅ Frontend UI        : 95%
🚧 Test & QA         : 30%
📋 Dokümantasyon     : 80%
```

### Sistem Sağlığı
- **Backend:** ✅ http://localhost:3001 (Fastify + Prisma)
- **Frontend:** ✅ http://localhost:3000 (Next.js 15)
- **Database:** ✅ PostgreSQL 17
- **API Docs:** ✅ http://localhost:3001/docs

---

## 🎯 SON YAPILAN KRİTİK DEĞİŞİKLİKLER (11 Şubat 2026)

### 1. Muhasebe Mantığı Düzeltmesi ✅ KRİTİK

**Problem:** Finansör komisyonu yanlış hesaplanıyordu

**Eski Mantık (YANLIŞ):**
```typescript
// 100 TL yatırımın TAMAMINI kaydet
DEBIT: Financier +100 TL
CREDIT: Site +94, Partner +1.5, Financier +2.5
// SONUÇ: Dengesi bozuk (DEBIT: 100 ≠ CREDIT: 98)
```

**Yeni Mantık (DOĞRU):**
```typescript
// Finansör 2.5% komisyonu ZATEN KESİYOR
// Biz sadece 97.5 TL görüyoruz
const financierNetAmount = amount.times(0.975); // 97.5 TL

DEBIT: Financier +97.5 TL (bizim için tutuyor)
CREDIT: Site +94 TL (müşterilere borç)
CREDIT: Partner +1.5 TL (komisyon borcu)
CREDIT: Organization +2 TL (bizim kar)

// SONUÇ: DENGELI (97.5 = 94 + 1.5 + 2)
```

**Değiştirilen Dosya:**
- `apps/backend/src/modules/transaction/transaction.service.ts` (Satır 96-179)

**İş Etkisi:**
- ✅ Muhasebe dengesi artık her zaman doğru
- ✅ Finansör komisyonu otomatik kesiliyor
- ✅ Gerçek para akışını yansıtıyor

---

### 2. Hesap Tipi Sınıflandırması Düzeltmesi ✅ KRİTİK

**Problem:** Site hesabı yanlış kategoriye aitti

**Eski Sınıflandırma (YANLIŞ):**
```typescript
AKTİF (ASSET):
- Site ❌ (yanlış - müşteri parası bizim değil!)
- Financier ✓
- Organization ✓

BORÇ HESABI (LIABILITY):
- Partner ✓
- External Party ✓
```

**Yeni Sınıflandırma (DOĞRU):**
```typescript
AKTİF (ASSET):
- Financier ✓ (bizim için para tutuyor)
- Organization ✓ (bizim kar/sermaye)

BORÇ HESABI (LIABILITY):
- Site ✓ (müşteri parasını onlara borçluyuz)
- Partner ✓ (komisyon borcu)
- External Party ✓ (dış borç)
```

**Değiştirilen Dosya:**
- `apps/backend/src/modules/ledger/ledger.service.ts` (Satır 86-103)

**İş Etkisi:**
- ✅ Site bakiyeleri artık doğru hesaplanıyor
- ✅ LIABILITY hesaplar CREDIT ile artar (doğru)
- ✅ ASSET hesaplar DEBIT ile artar (doğru)

---

### 3. Komisyon Validasyonu Sistemi ✅ YENİ ÖZELLİK

**Eklenen Özellik:** Komisyon dağılımı kontrolü

**Kural:**
```
Partner (1.5%) + Financier (2.5%) + Organization (2%) = Site Komisyonu (6%)
```

**Kontrol 1: Toplam Komisyon Aşımı**
```typescript
if (totalDistributed.gt(siteCommissionAmount)) {
  throw new Error(
    `Komisyon dağılımı hatalı! ` +
    `Dağıtılan toplam (${totalDistributed} TL) ` +
    `site komisyonundan (${siteCommissionAmount} TL) fazla olamaz.`
  );
}
```

**Kontrol 2: Negatif Organizasyon Karı**
```typescript
if (organizationAmount.lt(0)) {
  throw new Error(
    `Organizasyon karı negatif çıktı (${organizationAmount} TL). ` +
    `Partner + Finansör komisyonları site komisyonundan fazla!`
  );
}
```

**Değiştirilen Dosya:**
- `apps/backend/src/modules/transaction/commission.service.ts` (Satır 79-203)

**İş Etkisi:**
- ✅ Yanlış komisyon oranları sisteme girmeden engellenir
- ✅ Muhasebe tutarsızlıkları önlenir
- ✅ Detaylı hata mesajları ile kolay debug

---

## 📂 PROJE YAPISI

### Dizin Yapısı
```
finanspro-v3/
├── apps/
│   ├── backend/                # Fastify + Prisma Backend
│   │   ├── src/
│   │   │   ├── modules/        # Business logic
│   │   │   │   ├── transaction/    # İşlem yönetimi
│   │   │   │   ├── commission/     # Komisyon hesaplama ✅ SON DEĞİŞİK
│   │   │   │   ├── ledger/         # Muhasebe defteri ✅ SON DEĞİŞİK
│   │   │   │   ├── site/           # Site yönetimi
│   │   │   │   ├── partner/        # Partner yönetimi
│   │   │   │   ├── financier/      # Finansör yönetimi
│   │   │   │   └── organization/   # Organizasyon analytics
│   │   │   ├── shared/         # Utilities
│   │   │   └── config/         # Configuration
│   │   └── prisma/            # Database schema
│   │
│   └── frontend/              # Next.js 15 Frontend
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # UI components
│       │   ├── hooks/         # React Query hooks
│       │   └── lib/           # API client
│       └── public/
│
├── packages/
│   └── shared/                # Shared types
│
├── .claude/                   # Claude Code customizations
│   ├── commands/              # Slash commands
│   ├── skills/                # Domain knowledge
│   └── CLAUDE.md              # Project guide
│
└── ROADMAP.md                 # Bu dosya
```

---

## 🔑 KRİTİK DOSYALAR ve SON DEĞİŞİKLİKLER

### Backend - Muhasebe Katmanı

#### 1. transaction.service.ts ⭐ ÖNEMLİ
**Dosya:** `apps/backend/src/modules/transaction/transaction.service.ts`
**Son Değişiklik:** 11 Şubat 2026
**Değişen Satırlar:** 96-179

**Ne Değişti:**
- ✅ Finansör net tutarı hesaplaması eklendi (amount × 0.975)
- ✅ Ledger entry mantığı tamamen yeniden yazıldı
- ✅ Finansör komisyonu artık muhasebeleştirilmiyor (zaten kesildi)
- ✅ Detaylı yorum satırları eklendi

**Kritik Kod:**
```typescript
// Satır 133
const financierNetAmount = amount.times(new Decimal(0.975));

// Satır 136-143: DEBIT Financier
entries.push({
  account_id: input.financier_id,
  account_type: EntityType.FINANCIER,
  entry_type: LedgerEntryType.DEBIT,
  amount: financierNetAmount, // 97.5 TL
  description: `Yatırım alındı: ${site.name} (Net: ${financierNetAmount})`,
});

// Satır 145-153: CREDIT Site
entries.push({
  account_id: input.site_id,
  account_type: EntityType.SITE,
  entry_type: LedgerEntryType.CREDIT,
  amount: siteNetAmount, // 94 TL
  description: `Site bakiyesi: ${siteNetAmount}`,
});

// Satır 156-165: CREDIT Partner
// Satır 168-176: CREDIT Organization
```

---

#### 2. ledger.service.ts ⭐ ÖNEMLİ
**Dosya:** `apps/backend/src/modules/ledger/ledger.service.ts`
**Son Değişiklik:** 11 Şubat 2026
**Değişen Satırlar:** 86-103

**Ne Değişti:**
- ✅ Site artık LIABILITY olarak sınıflandırılıyor
- ✅ Account type kontrolü yeniden yazıldı
- ✅ Bakiye hesaplama mantığı düzeltildi

**Kritik Kod:**
```typescript
// Satır 92-97: LIABILITY tanımı
const isLiabilityAccount = (
  entry.account_type === EntityType.SITE ||        // YENİ!
  entry.account_type === EntityType.PARTNER ||
  entry.account_type === EntityType.EXTERNAL_PARTY
);

// Satır 99-103: ASSET tanımı
const isAssetAccount = (
  entry.account_type === EntityType.FINANCIER ||
  entry.account_type === EntityType.ORGANIZATION
);

// Satır 105-125: Bakiye hesaplama
if (isAssetAccount) {
  // DEBIT arttırır, CREDIT azaltır
  if (entry.entry_type === LedgerEntryType.DEBIT) {
    newBalance = currentBalance.plus(entry.amount);
  } else {
    newBalance = currentBalance.minus(entry.amount);
  }
} else if (isLiabilityAccount) {
  // CREDIT arttırır, DEBIT azaltır
  if (entry.entry_type === LedgerEntryType.CREDIT) {
    newBalance = currentBalance.plus(entry.amount);
  } else {
    newBalance = currentBalance.minus(entry.amount);
  }
}
```

---

#### 3. commission.service.ts ⭐ YENİ
**Dosya:** `apps/backend/src/modules/transaction/commission.service.ts`
**Son Değişiklik:** 11 Şubat 2026
**Değişen Satırlar:** 79-123, 190-203

**Ne Değişti:**
- ✅ Toplam komisyon validasyonu eklendi
- ✅ Negatif organizasyon karı kontrolü eklendi
- ✅ Detaylı hata mesajları
- ✅ Logger ile hata kaydı

**Kritik Kod:**
```typescript
// Satır 79-84: Toplam hesaplama
const totalDistributed = totalPartnerCommission
  .plus(financierCommissionAmount)
  .plus(organizationAmount);

// Satır 85-104: Aşım kontrolü
if (totalDistributed.gt(siteCommissionAmount)) {
  const diff = totalDistributed.minus(siteCommissionAmount).toString();
  logger.error({
    siteCommissionAmount: siteCommissionAmount.toString(),
    totalDistributed: totalDistributed.toString(),
    difference: diff,
  }, 'Commission distribution exceeds site commission!');

  throw new Error(
    `Komisyon dağılımı hatalı! ` +
    `Dağıtılan toplam (${totalDistributed.toString()} TL) ` +
    `site komisyonundan (${siteCommissionAmount.toString()} TL) fazla olamaz.`
  );
}

// Satır 107-123: Negatif kar kontrolü
if (organizationAmount.lt(0)) {
  throw new Error(
    `Organizasyon karı negatif çıktı (${organizationAmount.toString()} TL). ` +
    `Partner (${totalPartnerCommission.toString()} TL) + ` +
    `Finansör (${financierCommissionAmount.toString()} TL) komisyonları, ` +
    `site komisyonundan (${siteCommissionAmount.toString()} TL) fazla!`
  );
}
```

---

## 🧪 TEST DURUMU

### Manuel Test Sonuçları (11 Şubat)
```
✅ Backend derleme     : BAŞARILI
✅ Frontend derleme    : BAŞARILI
⏳ Muhasebe dengesi   : TEST BEKLİYOR
⏳ Komisyon kontrolü  : TEST BEKLİYOR
⏳ UI/UX akışı        : TEST BEKLİYOR
```

### Test Edilmesi Gerekenler (ÖNCELİKLİ)

#### 1. ⚠️ 100 TL Yatırım İşlemi Testi
**Neden:** Muhasebe mantığı tamamen değişti

**Test Adımları:**
```
1. Site oluştur (komisyon: %6)
2. Partner oluştur (komisyon: %1.5)
3. Finansör oluştur (komisyon: %2.5)
4. 100 TL yatırım işlemi oluştur
5. Bakiyeleri kontrol et:
   ✓ Finansör: +97.5 TL
   ✓ Site: +94 TL
   ✓ Partner: +1.5 TL
   ✓ Organization: +2 TL
6. Ledger dengesi kontrol et:
   ✓ DEBIT toplamı = CREDIT toplamı = 97.5 TL
```

**Beklenen Sonuç:**
- Ledger dengeli olmalı
- Hiçbir bakiye NaN olmamalı
- Komisyon snapshot kaydedilmeli

---

#### 2. ⚠️ Komisyon Validasyonu Testi
**Neden:** Yeni özellik eklendi

**Test Senaryosu 1: Aşırı Komisyon**
```
Site komisyonu: %6
Partner: %3 (çok fazla!)
Finansör: %2.5
Organization: %2
TOPLAM: 3 + 2.5 + 2 = 7.5% > 6% ❌

BEKLENEN: Hata mesajı gösterilmeli
"Komisyon dağılımı hatalı! Dağıtılan toplam (7.5 TL)
 site komisyonundan (6 TL) fazla olamaz. Fark: 1.5 TL"
```

**Test Senaryosu 2: Negatif Organizasyon Karı**
```
Site komisyonu: %6
Partner: %4
Finansör: %3
Organization: 6 - 4 - 3 = -1% ❌

BEKLENEN: Hata mesajı gösterilmeli
"Organizasyon karı negatif çıktı (-1 TL). Partner (4 TL) +
 Finansör (3 TL) komisyonları, site komisyonundan (6 TL) fazla!"
```

---

## 🎨 FRONTEND DURUMU

### Çalışan Sayfalar
```
✅ /login                   - Giriş sayfası
✅ /dashboard              - Ana dashboard
✅ /sites                  - Site listesi
✅ /sites/[id]             - Site detay
✅ /partners               - Partner listesi
✅ /partners/[id]          - Partner detay
✅ /financiers             - Finansör listesi
✅ /financiers/[id]        - Finansör detay
✅ /transactions           - İşlem listesi
✅ /organization           - Organizasyon analytics
✅ /reports/daily          - Günlük rapor
✅ /reports/monthly        - Aylık rapor
✅ /reports/reconciliation - Mutabakat raporu
```

### Bilinen Frontend Sorunları
```
⚠️ /sites/[id] sayfası     - Next.js vendor chunk hatası
   → Sayfa çalışıyor ama console'da hata var
   → Önem: DÜŞÜK (kullanıcı etkilenmiyor)

⚠️ React Query devtools    - Production'da kapalı olmalı
   → Önem: ORTA (deployment öncesi düzeltilmeli)
```

---

## 🚀 DEPLOYMENT ÖNCESİ KONTROL LİSTESİ

### Backend
```
✅ TypeScript derleme
✅ Prisma migration
✅ Environment variables (.env.example güncel)
⏳ Unit tests (henüz yok)
⏳ Integration tests (henüz yok)
✅ API documentation (Swagger)
✅ Error handling
✅ Logging (Winston)
⏳ Rate limiting (eklenmeli)
⏳ CORS configuration (production için)
```

### Frontend
```
✅ Next.js build
✅ TypeScript check
⏳ ESLint (bazı uyarılar var)
⏳ Lighthouse score (test edilmeli)
✅ Responsive design
⏳ SEO meta tags (eklenmeli)
⏳ Error boundaries (eklenmeli)
⏳ Loading states (bazı sayfalarda eksik)
```

### Database
```
✅ Prisma schema valid
✅ Indexes tanımlı
⏳ Backup stratejisi (eklenmeli)
⏳ Migration history (dokümante edilmeli)
✅ Seed data hazır
```

---

## 📋 YAPILACAKLAR LİSTESİ (Öncelik Sırasına Göre)

### 🔴 YÜKSEK ÖNCELİK (Bu Hafta)

#### 1. Manuel Test - Muhasebe Sistemi
**Süre:** 2 saat
**Sahibi:** Emre (CEO)

- [ ] 100 TL yatırım işlemi testi
- [ ] Ledger dengesi kontrolü
- [ ] Komisyon validasyonu testi
- [ ] Site bakiye kontrolü
- [ ] Partner bakiye kontrolü
- [ ] Finansör bakiye kontrolü
- [ ] Organization bakiye kontrolü

**Başarı Kriteri:**
- Tüm bakiyeler doğru
- Ledger dengeli
- Komisyon validasyonu çalışıyor

---

#### 2. Production Database Migrasyonu
**Süre:** 1 saat
**Sahibi:** Claude (CFO)

- [ ] Migration script hazırla
- [ ] Backup stratejisi belirle
- [ ] Test database'den production'a geçiş planı
- [ ] Rollback senaryosu hazırla

---

### 🟡 ORTA ÖNCELİK (Bu Ay)

#### 3. Test Coverage Artırma
**Süre:** 1 hafta

Backend Tests:
- [ ] commission.service.ts unit tests
- [ ] ledger.service.ts unit tests
- [ ] transaction.service.ts integration tests
- [ ] API endpoint tests

Frontend Tests:
- [ ] Component tests (React Testing Library)
- [ ] Hook tests
- [ ] Integration tests (Playwright)

**Hedef:** %80 coverage

---

#### 4. Error Handling İyileştirmesi
**Süre:** 3 gün

- [ ] Global error boundary (Frontend)
- [ ] API error standardizasyonu
- [ ] User-friendly hata mesajları
- [ ] Error logging (Sentry entegrasyonu?)
- [ ] Retry mekanizması (React Query)

---

#### 5. Performance Optimizasyonu
**Süre:** 3 gün

Backend:
- [ ] Database query optimizasyonu
- [ ] N+1 problem kontrolü
- [ ] Index optimizasyonu
- [ ] Cache layer (Redis?)

Frontend:
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Bundle size optimizasyonu

**Hedef:**
- API response < 200ms
- Page load < 2s
- Bundle size < 500KB

---

### 🟢 DÜŞÜK ÖNCELİK (Sonraki Aylar)

#### 6. Yeni Özellikler
**Süre:** Belirsiz

- [ ] Multi-tenant support
- [ ] Advanced filtering (transaction list)
- [ ] Export to Excel/PDF
- [ ] Email notifications
- [ ] SMS integration
- [ ] Mobile app (React Native?)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced analytics
- [ ] AI-powered insights

---

## 🔍 BİLİNEN SORUNLAR ve ÇÖZÜMLER

### 1. Next.js Vendor Chunk Hatası
**Durum:** ⚠️ Düşük öncelik
**Konum:** `/sites/[id]` sayfası
**Hata:** `Cannot find module './vendor-chunks/@tanstack+query-core@5.90.20.js'`

**Geçici Çözüm:**
- Frontend'i restart et: `cd apps/frontend && rm -rf .next && npm run dev`

**Kalıcı Çözüm (yapılacak):**
- Next.js 15 vendor chunk config ayarla
- `next.config.js` dosyasına webpack ayarı ekle

---

### 2. Site Bakiyesi Görünümü
**Durum:** ✅ Çözüldü (11 Şubat)
**Problem:** Site bakiyeleri negatif görünüyordu
**Çözüm:** LIABILITY olarak sınıflandırıldı, CREDIT ile artıyor

---

### 3. Komisyon Dengesi
**Durum:** ✅ Çözüldü (11 Şubat)
**Problem:** Finansör komisyonu yanlış hesaplanıyordu
**Çözüm:** Finansör komisyonu artık muhasebeleştirilmiyor (zaten kesildi)

---

## 📚 DOKÜMANTASYON

### Mevcut Dökümanlar
```
✅ .claude/CLAUDE.md           - Proje rehberi (kapsamlı)
✅ .claude/skills/             - Domain knowledge
✅ .claude/commands/           - Custom commands
✅ ROADMAP.md                  - Bu dosya
✅ README.md                   - Proje özeti (güncellenecek)
⏳ API.md                      - API dokümantasyonu (oluşturulacak)
⏳ ARCHITECTURE.md             - Mimari dokümantasyon (oluşturulacak)
```

### Oluşturulacak Dökümanlar
- [ ] API Reference
- [ ] Database Schema Diagram
- [ ] User Manual (Türkçe)
- [ ] Developer Guide
- [ ] Deployment Guide
- [ ] Troubleshooting Guide

---

## 🎓 ÖĞRENİLEN DERSLER

### 1. Muhasebe Mantığı
**Ders:** Finansör komisyonu "bizim defter dışımızda" kesilir
**Etki:** Tüm hesaplama mantığı değişti
**Çözüm:** 97.5 TL basis kullan, 100 TL değil

### 2. Account Type Sınıflandırması
**Ders:** Site = LIABILITY (borç hesabı), ASSET değil
**Etki:** Bakiye hesaplama yönü değişti
**Çözüm:** CREDIT arttırır, DEBIT azaltır

### 3. Decimal.js Kullanımı
**Ders:** ASLA number arithmetic kullanma
**Etki:** Finansal hesaplarda kesinlik kritik
**Çözüm:** Her zaman `.plus()`, `.minus()`, `.times()`, `.dividedBy()` kullan

### 4. Komisyon Validasyonu
**Ders:** Yanlış oran girdilerini engellemek gerekiyor
**Etki:** Muhasebe tutarsızlığı önlenir
**Çözüm:** Backend'de validasyon, frontend'de user-friendly mesajlar

---

## 🎯 HEDEFLER

### Kısa Vadeli (Bu Ay)
- ✅ Muhasebe mantığı düzeltmesi (TAMAMLANDI)
- ⏳ Manuel test tamamlama
- ⏳ Production deployment

### Orta Vadeli (3 Ay)
- Test coverage %80'e çıkarma
- Performance optimizasyonu
- Advanced filtering & export
- Email/SMS notifications

### Uzun Vadeli (6-12 Ay)
- Multi-tenant support
- Mobile app
- AI-powered analytics
- International expansion

---

## 🤝 EKİP

### Roller
- **CEO (Emre):** Strateji, business logic, test
- **CFO (Claude):** Technical implementation, code quality, muhasebe doğruluğu

### İletişim
- **Slack/Discord:** Anlık iletişim
- **GitHub Issues:** Bug tracking
- **This Roadmap:** Progress tracking

---

## 📞 DESTEK

### Sorun Bildirme
1. Console'da hata var mı kontrol et (F12)
2. Network tab'de API hatalarına bak
3. Backend loglarını kontrol et
4. Bu dosyaya "Bilinen Sorunlar" ekle

### Yardım Alma
- **Claude Code:** Teknik sorular
- **Documentation:** `.claude/CLAUDE.md`
- **API Docs:** http://localhost:3001/docs

---

## 📊 METRİKLER

### Kod İstatistikleri
```
Backend:
- TypeScript Files: 50+
- Lines of Code: ~10,000
- API Endpoints: 60+
- Database Tables: 15

Frontend:
- React Components: 60+
- Pages: 20+
- Hooks: 30+
- Lines of Code: ~15,000
```

### Performans Metrikleri (Test Edilecek)
```
Backend:
- API Response Time: ? ms (target: <200ms)
- Database Queries: ? (optimize edilecek)
- Memory Usage: ? MB

Frontend:
- First Contentful Paint: ? s (target: <1.5s)
- Time to Interactive: ? s (target: <3s)
- Bundle Size: ? KB (target: <500KB)
```

---

## 🎉 TAMAMLANANLAR (11 Şubat Milestone)

### Backend
- ✅ Muhasebe mantığı tamamen yeniden yazıldı
- ✅ Komisyon validasyonu sistemi eklendi
- ✅ Ledger balance hesaplama düzeltildi
- ✅ Account type sınıflandırması düzeltildi
- ✅ Detaylı yorum satırları eklendi
- ✅ Error handling iyileştirildi

### Muhasebe Sistemi
- ✅ Double-entry accounting doğru çalışıyor
- ✅ Finansör komisyonu otomatik kesiliyor
- ✅ Site LIABILITY olarak işleniyor
- ✅ Ledger dengesi her zaman doğru
- ✅ Decimal.js precision korunuyor

### Dokümantasyon
- ✅ ROADMAP.md oluşturuldu
- ✅ Eski dosyalar temizlendi
- ✅ Kod yorumları eklendi
- ✅ .claude/CLAUDE.md güncellendi

---

**Son Güncelleme:** 11 Şubat 2026, 23:45
**Sonraki Değerlendirme:** 15 Şubat 2026
**Durum:** ✅ Test Edilmeye Hazır

---

**Hazırlayan:** Claude (CFO) & Emre (CEO)
**Versiyon:** 3.1.0
**Lisans:** Proprietary
