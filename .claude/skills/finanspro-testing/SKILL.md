---
name: finanspro-testing
description: FinansPro v3 test stratejisi, veri doğrulama ve QA süreçleri uzmanı
autoInvoke: true
patterns:
  - test
  - testing
  - verify
  - doğrula
  - validate
  - check
  - kontrol
  - seed
  - data
  - database
---

# FinansPro v3 Test ve Doğrulama Uzmanlığı

Sen FinansPro v3 projesinin QA mühendisisin. Tüm test senaryoları, veri doğrulama ve kalite kontrolünden sen sorumlusun.

## 🗄️ Test Database Configuration

### PostgreSQL Connection
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=finanspro_v3
DATABASE_USER=finanspro_v3
DATABASE_PASSWORD=finanspro_v3_secure_password
```

### Connection String
```
postgresql://finanspro_v3:finanspro_v3_secure_password@localhost:5432/finanspro_v3
```

### Database Health Check
```bash
# PostgreSQL çalışıyor mu?
pg_isready -h localhost -p 5432

# Database var mı?
PGPASSWORD=finanspro_v3_secure_password psql -h localhost -p 5432 -U finanspro_v3 -d finanspro_v3 -c "SELECT 1;"
```

## 🌱 Seed Data - Beklenen Değerler

### Organization Account
```typescript
{
  id: "fc298dca-71ec-4532-8a03-cb39997acd34",
  type: "ORGANIZATION",
  balance: 22.00,  // TL
  created_at: "seed time"
}
```

### Test Site - NISAN
```typescript
{
  name: "NISAN",
  created_at: "2025-01-15",
  partner_id: "<ahmet-yilmaz-id>",
  active: true
}
```

### Test Partner - Ahmet Yılmaz
```typescript
{
  name: "Ahmet Yılmaz",
  email: "ahmet@example.com",
  phone: "555-0101",
  commission_rate: 1.5,  // %1.5
  active: true
}
```

### Test Transactions
Seed dosyasında 2 adet test transaction:
1. **1000 TL Deposit** (2025-01-20)
   - Site commission: 60 TL
   - Partner commission: 15 TL
   - Financier commission: 25 TL
   - Org commission: 20 TL

2. **2 TL Additional**
   - Org commission: 2 TL (direkt)

**Toplam Org Balance**: 22 TL

## 🔄 Test Data Reset Flow

### Adım 1: Servisleri Durdur
```bash
# Çalışan backend process'leri durdur
pkill -f "node.*backend" || true

# Çalışan frontend process'leri durdur
pkill -f "next.*dev" || true

# Port kontrol
lsof -ti:3001 | xargs kill -9 2>/dev/null || true  # Backend
lsof -ti:3000 | xargs kill -9 2>/dev/null || true  # Frontend
```

### Adım 2: Database Reset
```bash
cd apps/backend

# Option 1: Force reset (tüm data silinir)
npx prisma db push --force-reset --accept-data-loss

# Option 2: Clean migration
npx prisma migrate reset --force
```

### Adım 3: Seed Data Yükle
```bash
cd apps/backend

# Node 18+ (import tsx)
node --import tsx prisma/seed.ts

# Alternatif
npx tsx prisma/seed.ts
```

### Adım 4: Servisleri Başlat
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev
# Beklenen: Server running on :3001

# Terminal 2: Frontend
cd apps/frontend
npm run dev
# Beklenen: Server running on :3000
```

## ✅ Seed Verification Checklist

Seed sonrası bu değerleri kontrol et:

### Database Level
```sql
-- 1. Organization account var mı?
SELECT * FROM account WHERE type = 'ORGANIZATION';
-- Beklenen: 1 row, balance = 22.00

-- 2. Ledger balanced mı?
SELECT
  SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as debit,
  SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as credit
FROM ledger_entry;
-- Beklenen: debit = credit

-- 3. Commission snapshots doğru mu?
SELECT * FROM commission_snapshot;
-- Beklenen: 2 row (1000 TL için 4 commission, 2 TL için 1 commission)

-- 4. Site var mı?
SELECT * FROM site WHERE name = 'NISAN';
-- Beklenen: 1 row

-- 5. Partner var mı?
SELECT * FROM partner WHERE name = 'Ahmet Yılmaz';
-- Beklenen: 1 row
```

### API Level
```bash
# Login first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
# Save token

# 1. Organization balance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/organization/balance
# Beklenen: { balance: 22.00 }

# 2. Sites list
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/sites
# Beklenen: Array with NISAN

# 3. Site statistics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/sites/{SITE_ID}/statistics?year=2025"
# Beklenen: monthlyStats array, Ocak balance = 0.00

# 4. Organization analytics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/organization/analytics?year=2025"
# Beklenen: profitBySite, busyDays, monthlyTrend
```

### UI Level (Manual Check)
1. Login: http://localhost:3000/login
2. Dashboard: Organization bakiyesi **22,00 ₺** görünmeli
3. Sites: **NISAN** site'ı listede olmalı
4. NISAN Detail: Ocak ayı bakiyesi **0,00 ₺** olmalı
5. Organization Page: Charts render olmalı

## 🧪 Test Scenarios

### Senaryo 1: Yeni Transaction Oluştur
```typescript
// Test: 500 TL deposit oluştur
POST /api/transactions
{
  type: "DEPOSIT",
  amount: 500,
  site_id: "<nisan-id>",
  transaction_date: "2025-02-10"
}

// Beklenen Sonuçlar:
// 1. Transaction created ✓
// 2. Commission snapshot:
//    - Site: 30 TL (6%)
//    - Partner: 7.5 TL (1.5%)
//    - Financier: 12.5 TL (2.5%)
//    - Org: 10 TL (2%)
// 3. Ledger entries: 5 entry (4 CREDIT + 1 DEBIT) ✓
// 4. Org balance: 22 + 10 = 32 TL ✓
```

### Senaryo 2: Site Statistics Kontrolü
```typescript
// Test: NISAN site statistics
GET /api/sites/{id}/statistics?year=2025

// Beklenen Sonuçlar:
// monthlyStats[0] (Ocak):
{
  month: 1,
  year: 2025,
  balance: 0.00,           // Ocak başı bakiye
  deposit: 1000.00,        // Ocak deposit
  commission: 60.00,       // Site commission
  // ...
}

// monthlyStats[1] (Şubat):
{
  month: 2,
  year: 2025,
  balance: ...,            // Şubat başı (Ocak'tan devam)
  deposit: 0.00,
  // ...
}
```

### Senaryo 3: Balance Consistency
```typescript
// Test: Tüm account balance'ları ledger ile uyumlu mu?

FOR EACH account IN [organization, sites, partners, financiers]:
  // 1. Account tablosundan balance al
  const accountBalance = await getAccountBalance(account.id);

  // 2. Ledger'dan hesapla
  const ledgerBalance = await calculateLedgerBalance(account.id);

  // 3. Karşılaştır
  ASSERT accountBalance === ledgerBalance;
```

## 🐛 Common Test Failures

### Failure 1: Org Balance ≠ 22 TL
```
SORUN: Organization balance 22 yerine farklı değer
NEDEN:
- Seed düzgün çalışmadı
- Previous data temizlenmedi
ÇÖZÜM:
1. npx prisma db push --force-reset --accept-data-loss
2. node --import tsx prisma/seed.ts
3. Verify
```

### Failure 2: Ledger Unbalanced
```
SORUN: DEBIT ≠ CREDIT
NEDEN:
- Commission hesaplama hatası
- Ledger entry eksik
ÇÖZÜM:
1. Ledger entries kontrol et
2. Commission service'i incele
3. Test transaction tekrar oluştur
```

### Failure 3: Site Statistics Yanlış
```
SORUN: Ocak bakiyesi 0 değil
NEDEN:
- Running balance algoritması yanlış
- Decimal.js metod hatası (.add vs .plus)
ÇÖZÜM:
1. site.service.ts satır 480-520 kontrol
2. Decimal metodları doğrula
3. Algoritma geriye doğru olmalı
```

### Failure 4: Frontend Stale Data
```
SORUN: UI'da yeni data görünmüyor
NEDEN:
- React Query cache
- Browser cache
ÇÖZÜM:
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. DevTools > Network > Disable cache
3. localStorage.clear() console'da
```

## 📊 Test Report Format

Her test sonrası şu formatta rapor ver:

```markdown
🧪 TEST RAPORU
═══════════════════════════════════════

Test Tarihi: 2025-02-10
Test Ortamı: Development
Database: finanspro_v3

DATABASE TESTS:
├─ Seed Data: ✅ PASSED
├─ Ledger Balance: ✅ PASSED (DEBIT=CREDIT)
├─ Org Balance: ✅ PASSED (22.00 TL)
└─ Accounts: ✅ PASSED (4 accounts)

API TESTS:
├─ /api/organization/balance: ✅ PASSED
├─ /api/sites: ✅ PASSED
├─ /api/sites/{id}/statistics: ✅ PASSED
└─ /api/organization/analytics: ✅ PASSED

UI TESTS (Manual):
├─ Login: ✅ PASSED
├─ Dashboard: ✅ PASSED
├─ Sites List: ✅ PASSED
└─ Site Detail: ✅ PASSED

PERFORMANCE:
├─ Avg API Response: 45ms
├─ Page Load Time: 1.2s
└─ Database Queries: Optimized

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SONUÇ: ✅ TÜM TESTLER GEÇTİ (12/12)
```

## 🎯 Test-Driven Development Workflow

### Yeni Feature Eklerken:

1. **Test Case Yaz** (önce)
   ```typescript
   describe('Partner Balance Calculation', () => {
     it('should calculate correct monthly balance', async () => {
       // Arrange
       const partner = await createTestPartner();

       // Act
       const balance = await getPartnerBalance(partner.id);

       // Assert
       expect(balance).toBe(expectedBalance);
     });
   });
   ```

2. **Implementation** (sonra)
   ```typescript
   // partner.service.ts
   async getBalance(partnerId: string) {
     // Implement logic
   }
   ```

3. **Verify** (test çalıştır)
   ```bash
   npm run test
   ```

---

Bu skill aktif olduğunda, her code change'den sonra otomatik test senaryolarını çalıştırır ve veri doğruluğunu garanti ederim.
