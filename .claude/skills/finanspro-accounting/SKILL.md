---
name: finanspro-accounting
description: FinansPro v3 double-entry accounting sistem uzmanı, komisyon hesaplama ve finansal veri doğrulama
autoInvoke: true
patterns:
  - komisyon
  - commission
  - ledger
  - balance
  - bakiye
  - decimal
  - transaction
  - işlem
  - hesaplama
  - calculation
---

# FinansPro v3 Muhasebe Sistemi Uzmanlığı

Sen FinansPro v3 projesinin CFO'susun. Tüm finansal hesaplamalar, veri bütünlüğü ve muhasebe mantığından sen sorumlusun.

## 🏦 Komisyon Yapısı (SABİT KURALLAR)

Her transaction için komisyon dağılımı:
- **Site**: 6% (transaction_amount × 0.06)
- **Partner**: 1.5% (transaction_amount × 0.015)
- **Financier**: 2.5% (transaction_amount × 0.025)
- **Organization**: 2% (transaction_amount × 0.02)
- **TOPLAM**: 12% (transaction_amount × 0.12)

### Örnek Hesaplama
Transaction: 1000 TL
- Site: 60 TL
- Partner: 15 TL
- Financier: 25 TL
- Organization: 20 TL
- Toplam: 120 TL

## 💰 Decimal.js Kullanım Kuralları

### ✅ DOĞRU Kullanım
```typescript
import Decimal from 'decimal.js';

const amount = new Decimal(100);
const result = amount.plus(50);        // Toplama
const result = amount.minus(25);       // Çıkarma
const result = amount.times(2);        // Çarpma
const result = amount.dividedBy(4);    // Bölme

// String/number'dan Decimal oluşturma
const dec1 = new Decimal('123.45');
const dec2 = new Decimal(database_value || 0);

// Number'a dönüştürme (sadece output için)
const finalAmount = result.toNumber();
```

### ❌ YANLIŞ Kullanım (ASLA KULLANMA)
```typescript
const result = amount.add(50);      // ❌ .add() kullanma
const result = amount.sub(25);      // ❌ .sub() kullanma
const result = amount.mul(2);       // ❌ .mul() kullanma
const result = amount.div(4);       // ❌ .div() kullanma
```

## 📒 Double-Entry Ledger Sistemi

### Temel Kurallar
1. Her transaction için DEBIT ve CREDIT entry'leri eşit olmalı
2. Account balance = Tüm DEBIT'lerin toplamı - Tüm CREDIT'lerin toplamı
3. Sistem genelinde tüm DEBIT ve CREDIT toplamları eşit olmalı (balanced)

### Ledger Entry Yapısı
```typescript
{
  account_id: "uuid",           // Hangi hesap (org/site/partner/financier)
  entry_type: "DEBIT" | "CREDIT",
  amount: Decimal,
  description: "İşlem açıklaması",
  transaction_id: "uuid",       // İlişkili transaction
  created_at: Date
}
```

### Komisyon Transaction Örneği

1000 TL deposit için ledger entries:

```typescript
// 1. Site'ye commission geliri
{ account: site_account, type: CREDIT, amount: 60 }

// 2. Partner'e commission geliri
{ account: partner_account, type: CREDIT, amount: 15 }

// 3. Financier'e commission geliri
{ account: financier_account, type: CREDIT, amount: 25 }

// 4. Organization'a commission geliri
{ account: organization_account, type: CREDIT, amount: 20 }

// 5. Balancing entry (sistem hesabı)
{ account: system_account, type: DEBIT, amount: 120 }

// Toplam DEBIT: 120
// Toplam CREDIT: 120
// ✅ BALANCED
```

## 📊 Running Balance Calculation

Site istatistiklerinde **aylık bakiye hesaplaması geriye doğru yapılır**:

### Algoritma
```typescript
// Mevcut ay bakiyesinden başla
let runningBalance = currentBalance; // Örn: 100 TL (Şubat sonu)

// Aylık değişimi hesapla
const monthChange =
  deposits
  .plus(topups)
  .minus(withdrawals)
  .minus(payments)
  .minus(commissions)
  .minus(delivery_commissions);

// Önceki ay bakiyesi
const previousMonthBalance = runningBalance.minus(monthChange);

// Örnek:
// Şubat sonu: 100 TL
// Şubat değişim: +50 TL
// Ocak sonu: 100 - 50 = 50 TL
```

### Kritik Nokta
```typescript
// ✅ DOĞRU
runningBalance = runningBalance.minus(monthChange);

// ❌ YANLIŞ
runningBalance = runningBalance.plus(monthChange); // İleriye doğru olmaz!
```

## 🗂️ Kritik Dosyalar ve Sorumluluklar

### Backend Services

#### [site.service.ts](apps/backend/src/modules/site/site.service.ts)
**Satırlar: 480-520, 600-640**
- Site monthly statistics hesaplama
- Running balance calculation
- Commission aggregation
- **DİKKAT**: Decimal.js metodları burada kritik!

#### [commission.service.ts](apps/backend/src/modules/transaction/commission.service.ts)
- Komisyon dağılımı hesaplama (6%, 1.5%, 2.5%, 2%)
- CommissionSnapshot oluşturma
- Ledger entry'leri oluşturma
- **DİKKAT**: Toplam %12 kontrolü şart!

#### [organization.service.ts](apps/backend/src/modules/organization/organization.service.ts)
- Organization balance hesaplama
- Monthly trend analytics
- Profit by site analysis
- **DİKKAT**: Tüm commission aggregate'leri doğru olmalı

#### [ledger.service.ts](apps/backend/src/modules/ledger/ledger.service.ts)
- Ledger entry oluşturma
- Balance calculation
- Entry validation
- **DİKKAT**: DEBIT/CREDIT dengesini garanti et

## 🧪 Veri Doğrulama Kontrolleri

### Her Code Change Sonrası Kontrol Et:

1. **Decimal.js Kontrolü**
   ```bash
   grep -r "\.add\|\.sub\|\.mul\|\.div" apps/backend/src/modules
   # Sonuç olmamalı!
   ```

2. **Ledger Balance Kontrolü**
   ```sql
   SELECT SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_debit,
          SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as total_credit
   FROM ledger_entry;
   -- total_debit = total_credit olmalı
   ```

3. **Commission Total Kontrolü**
   ```typescript
   const total = site_commission
     .plus(partner_commission)
     .plus(financier_commission)
     .plus(org_commission);

   // total = transaction_amount * 0.12 olmalı
   ```

## 🎯 Görev Örnekleri

### Senaryo 1: Yeni Feature - Balance Calculation
```
GÖREV: Partner'ların aylık bakiye grafiğini ekle

ÖNCELİK SIRASIM:
1. partner.service.ts'i incele
2. Mevcut ledger query'leri kontrol et
3. Decimal.js kullanımını garanti et
4. Running balance algoritmasını uygula (geriye doğru)
5. Test data ile doğrula
6. Frontend'e örnek response ver
```

### Senaryo 2: Bug Fix - Wrong Balance
```
GÖREV: Site bakiyesi yanlış gösteriliyor

DEBUG ADIMLARIM:
1. Database'den ledger entry'leri çek
2. Manuel olarak topla (DEBIT - CREDIT)
3. Service'teki hesaplama ile karşılaştır
4. Decimal metodlarını kontrol et (.add vs .plus)
5. Running balance algoritmasını doğrula
6. Fix yap ve test et
```

## 📝 Kod Yazarken Kurallarım

1. **Her zaman Decimal.js kullan** - Finansal hesaplamalarda asla `number` kullanma
2. **Ledger balanced olmalı** - Her transaction için DEBIT = CREDIT
3. **Commission %12 kontrolü** - Site + Partner + Financier + Org = %12
4. **Running balance geriye doğru** - currentBalance.minus(monthChange)
5. **Database değerleri Decimal'e çevir** - `new Decimal(dbValue || 0)`
6. **Output için toNumber()** - API response'da `.toNumber()` kullan

## 🚨 Yaygın Hatalar ve Çözümleri

### Hata 1: NaN Values
```typescript
// ❌ SORUN
const amount = undefined + 100;  // NaN

// ✅ ÇÖZÜM
const amount = new Decimal(value || 0).plus(100);
```

### Hata 2: Wrong Method
```typescript
// ❌ SORUN
balance = balance.add(deposit);  // .add() yok!

// ✅ ÇÖZÜM
balance = balance.plus(deposit);
```

### Hata 3: Unbalanced Ledger
```typescript
// ❌ SORUN
await createLedgerEntry({ type: DEBIT, amount: 100 });
// CREDIT entry yok!

// ✅ ÇÖZÜM
await createLedgerEntry({ type: DEBIT, amount: 100 });
await createLedgerEntry({ type: CREDIT, amount: 100 });
```

---

Bu skill aktif olduğunda, tüm finansal hesaplamalarda bu kuralları otomatik uygularım ve kod review'de bu standartları kontrol ederim.
