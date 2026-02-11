# 📝 FinansPro v3 - Geliştirme Günlüğü (Changelog)

**Proje:** FinansPro v3 - Modern Finansal Yönetim SaaS
**Format:** [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
**Versiyonlama:** [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## 📋 Değişiklik Tipleri

- **Added:** Yeni özellikler
- **Changed:** Mevcut işlevsellikte değişiklikler
- **Deprecated:** Yakında kaldırılacak özellikler
- **Removed:** Kaldırılan özellikler
- **Fixed:** Hata düzeltmeleri
- **Security:** Güvenlik açıklarına yönelik düzeltmeler

---

## [Unreleased]

### Planlanan
- Unit test coverage (hedef: %80)
- Performance optimizasyonu
- Excel/PDF export
- Email/SMS notifications

---

## [3.1.0] - 2026-02-11 🎯 KRİTİK MUHASEBE DÜZELTMESİ

### 🔴 KRITIK - Fixed

#### Muhasebe Mantığı Tamamen Yeniden Yazıldı
**Sorun:** Finansör komisyonu yanlış hesaplanıyordu, ledger dengesi bozuluyordu.

**Etkilenen Dosya:**
- `apps/backend/src/modules/transaction/transaction.service.ts`

**Değişiklik Detayı:**
```typescript
// ÖNCESİ (YANLIŞ):
// 100 TL yatırımın tamamını kaydet
DEBIT: Financier +100 TL
CREDIT: Site +94, Partner +1.5, Financier +2.5
// Sonuç: DEBIT (100) ≠ CREDIT (98) ❌ DENGESİZ!

// SONRASI (DOĞRU):
// Finansör 2.5% komisyonu ZATEN KESİYOR
// Biz sadece 97.5 TL görüyoruz
const financierNetAmount = amount.times(0.975); // 97.5 TL

DEBIT: Financier +97.5 TL
CREDIT: Site +94, Partner +1.5, Organization +2
// Sonuç: DEBIT (97.5) = CREDIT (97.5) ✅ DENGELİ!
```

**Değişen Satırlar:** 96-179
**Commit:** `feat: Fix accounting logic for financier commission pre-cut`
**Etki:** 🔴 YÜKSEK - Tüm muhasebe sistemi etkilendi
**Test Durumu:** ⏳ Manuel test gerekli

**Teknik Notlar:**
- Finansör komisyonu artık muhasebe defterine girmez
- Gerçek para akışını yansıtır (100 TL gelir, finansör 2.5 TL keser, biz 97.5 TL görürüz)
- Decimal.js precision korundu
- Detaylı yorum satırları eklendi

---

#### Hesap Tipi Sınıflandırması Düzeltildi
**Sorun:** Site hesabı ASSET olarak sınıflandırılmıştı (yanlış), müşteri parası bizim değil!

**Etkilenen Dosya:**
- `apps/backend/src/modules/ledger/ledger.service.ts`

**Değişiklik Detayı:**
```typescript
// ÖNCESİ (YANLIŞ):
ASSET: Site, Financier, Organization
LIABILITY: Partner, External Party

// SONRASI (DOĞRU):
ASSET: Financier, Organization (bizim para/kar)
LIABILITY: Site, Partner, External Party (onlara borç)
```

**Değişen Satırlar:** 86-103
**Commit:** `fix: Classify Site as LIABILITY account`
**Etki:** 🔴 YÜKSEK - Bakiye hesaplama yönü değişti
**Test Durumu:** ⏳ Manuel test gerekli

**Teknik Notlar:**
- Site artık LIABILITY (borç hesabı)
- CREDIT arttırır, DEBIT azaltır
- Müşteri parası siteye ait, biz sadece yönetiyoruz
- Balance formula: CREDIT - DEBIT (LIABILITY için)

---

### ✅ Added

#### Komisyon Validasyon Sistemi
**Özellik:** Komisyon dağılımının site komisyonunu aşmasını engeller

**Etkilenen Dosya:**
- `apps/backend/src/modules/transaction/commission.service.ts`

**Eklenen Kontroller:**

**1. Toplam Komisyon Aşımı Kontrolü**
```typescript
// Partner + Financier + Organization ≤ Site Commission
if (totalDistributed.gt(siteCommissionAmount)) {
  throw new Error(
    `Komisyon dağılımı hatalı! ` +
    `Dağıtılan toplam (${totalDistributed} TL) ` +
    `site komisyonundan (${siteCommissionAmount} TL) fazla olamaz.`
  );
}
```

**2. Negatif Organizasyon Karı Kontrolü**
```typescript
if (organizationAmount.lt(0)) {
  throw new Error(
    `Organizasyon karı negatif çıktı (${organizationAmount} TL). ` +
    `Partner + Finansör komisyonları site komisyonundan fazla!`
  );
}
```

**Değişen Satırlar:** 79-123 (deposit), 190-203 (withdrawal)
**Commit:** `feat: Add commission distribution validation`
**Etki:** 🟡 ORTA - Hatalı veri girişini engeller
**Test Durumu:** ⏳ Manuel test gerekli

**Teknik Notlar:**
- Backend'de validasyon yapılıyor
- Detaylı error logging
- User-friendly Türkçe hata mesajları
- Matematiksel tutarlılık garantisi

---

### 📚 Documentation

#### Kapsamlı Dokümantasyon Oluşturuldu

**Eklenen Dosyalar:**
1. **ROADMAP.md** (19 KB)
   - Proje durumu ve geliştirme planı
   - Son değişiklikler detaylı açıklama
   - Kritik dosyalar ve satır numaraları
   - Test senaryoları
   - Yapılacaklar listesi (öncelik sıralı)
   - Bilinen sorunlar ve çözümler
   - Öğrenilen dersler

2. **README.md** (7.7 KB)
   - Proje özeti
   - Hızlı başlangıç (adım adım)
   - Teknoloji stack
   - Temel kavramlar (komisyon, double-entry)
   - Tasarım sistemi
   - Geliştirme komutları

3. **CHANGELOG.md** (bu dosya)
   - Tüm değişikliklerin kronolojik kaydı
   - Versiyon bazlı organizasyon
   - Teknik detaylar ve commit referansları

**Silinen Dosyalar:**
- ❌ `PROJE_DURUM_RAPORU.md` (eski, 7 Şubat)
- ❌ `MANUEL_TEST_SENARYOSU.md` (eski, 7 Şubat)
- ❌ `LEDGER_BALANCE_FIX.md` (eski, 7 Şubat)
- ❌ `TEST_BASLAT.md` (eski, 7 Şubat)

**Commit:** `docs: Create comprehensive documentation structure`
**Etki:** 🟢 DÜŞÜK - Kod değişmedi, dokümantasyon iyileşti
**Durum:** ✅ Tamamlandı

---

### 🔧 Technical

#### Code Comments ve Açıklamalar Eklendi

**Değişiklikler:**
- Transaction service'de 85 satır detaylı yorum
- Ledger service'de account type açıklaması
- Commission service'de validasyon mantığı açıklaması
- İş akışı (business flow) açıklamaları
- Örnek senaryolar (100 TL yatırım)

**Etkilenen Dosyalar:**
- `transaction.service.ts` (Satır 96-180)
- `ledger.service.ts` (Satır 86-125)
- `commission.service.ts` (Satır 21-40, 79-123)

**Commit:** `docs: Add comprehensive code comments`
**Etki:** 🟢 DÜŞÜK - Kod davranışı değişmedi
**Durum:** ✅ Tamamlandı

---

## [3.0.0] - 2026-02-07 🚀 İLK YAYINLAMA

### Added

#### Temel Altyapı
- ✅ Fastify 5 backend setup
- ✅ Prisma 6 ORM integration
- ✅ PostgreSQL 17 database
- ✅ Next.js 15 frontend (App Router)
- ✅ React Query state management
- ✅ Tailwind CSS 4 styling
- ✅ shadcn/ui components

#### İş Mantığı Modülleri
- ✅ Site management
- ✅ Partner management
- ✅ Financier management
- ✅ Transaction processing
- ✅ Commission calculation
- ✅ Ledger system (double-entry)
- ✅ Organization analytics

#### Kullanıcı Arayüzü
- ✅ Dashboard (genel bakış)
- ✅ Site listesi ve detay sayfası
- ✅ Partner listesi ve detay sayfası
- ✅ Financier listesi ve detay sayfası
- ✅ Transaction listesi
- ✅ Organization analytics sayfası
- ✅ Günlük/aylık raporlar
- ✅ Mutabakat raporu

#### Güvenlik ve Auth
- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ Role-based access control (ADMIN, USER)
- ✅ Protected routes

#### Database Schema
- ✅ 15 tablo (users, sites, partners, financiers, etc.)
- ✅ İndeksler ve foreign keys
- ✅ Soft delete support
- ✅ Audit logging

---

## [Önceki Versiyonlar]

### [2.x.x] - Legacy System
- Eski PHP sistemi (artık kullanılmıyor)
- Migration tamamlandı

### [1.x.x] - Prototype
- Excel tabanlı prototip
- Artık kullanılmıyor

---

## 🎯 Versiyon Kuralları

### Semantic Versioning (MAJOR.MINOR.PATCH)

```
MAJOR: Breaking changes (API değişikliği, eski versiyon uyumsuz)
MINOR: Yeni özellikler (geriye uyumlu)
PATCH: Bug fixes (geriye uyumlu)
```

**Örnekler:**
- `3.0.0 → 3.1.0`: Yeni özellik (komisyon validasyonu)
- `3.1.0 → 3.1.1`: Bug fix (küçük düzeltme)
- `3.1.1 → 4.0.0`: Breaking change (API değişikliği)

---

## 📝 Kayıt Kuralları

### Her Değişiklik İçin

**Zorunlu Bilgiler:**
1. **Tarih:** YYYY-MM-DD formatında
2. **Versiyon:** Semantic versioning
3. **Tip:** Added/Changed/Fixed/Removed
4. **Başlık:** Kısa açıklama
5. **Etkilenen Dosyalar:** Path ve satır numaraları
6. **Etki Seviyesi:** 🔴 YÜKSEK / 🟡 ORTA / 🟢 DÜŞÜK

**Opsiyonel Bilgiler:**
- Commit hash/mesaj
- Test durumu
- Teknik notlar
- Kod örnekleri
- Öncesi/sonrası karşılaştırması

### Örnek Kayıt Formatı

```markdown
## [X.Y.Z] - YYYY-MM-DD Kısa Başlık

### Fixed

#### Açıklayıcı Alt Başlık
**Sorun:** Ne yanlıştı?

**Etkilenen Dosya:**
- `path/to/file.ts`

**Değişiklik Detayı:**
```typescript
// Öncesi
old code

// Sonrası
new code
```

**Değişen Satırlar:** X-Y
**Commit:** `commit message`
**Etki:** 🔴/🟡/🟢 + Açıklama
**Test Durumu:** ✅/⏳/❌

**Teknik Notlar:**
- Not 1
- Not 2
```

---

## 🔍 Nasıl Kullanılır?

### Yeni Değişiklik Ekleme

```bash
# 1. Değişikliği yap
# 2. Test et
# 3. Bu dosyayı aç
# 4. [Unreleased] altına ekle
# 5. Versiyon çıkarken [X.Y.Z] yap
# 6. Git commit
```

### Versiyon Çıkarma

```bash
# 1. [Unreleased] → [X.Y.Z] yap
# 2. Tarih ekle
# 3. Yeni [Unreleased] bölümü oluştur
# 4. Git tag: git tag -a v3.1.0 -m "Release v3.1.0"
# 5. Push: git push origin v3.1.0
```

---

## 📚 İlgili Dökümanlar

- **[ROADMAP.md](./ROADMAP.md)** - Geliştirme planı ve yapılacaklar
- **[README.md](./README.md)** - Proje özeti ve başlangıç
- **[.claude/CLAUDE.md](./.claude/CLAUDE.md)** - Kapsamlı proje rehberi

---

## 📊 İstatistikler

```
Toplam Versiyon: 2 (v3.0.0, v3.1.0)
Toplam Değişiklik: 15+
Son Güncelleme: 11 Şubat 2026
Sonraki Versiyon: v3.2.0 (Test & Optimization)
```

---

**Notlar:**
- Bu dosya **HER DEĞIŞIKLIKTEN SONRA** güncellenmelidir
- Küçük değişiklikler bile kaydedilmelidir
- Teknik detaylar önemlidir (gelecekte referans için)
- Kod örnekleri eklenmelidir (anlaşılır olması için)

**Son Güncelleme:** 11 Şubat 2026, 01:15
**Güncelleme Sıklığı:** Her commit'te
**Sorumlu:** Tüm geliştiriciler

---

**FinansPro v3** - ©2026
