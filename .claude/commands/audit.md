# Finansal Doğruluk Audit Komutu

Projedeki tüm finansal hesaplamaları ve veri bütünlüğünü kontrol et:

## Backend Kontrolleri

1. **Decimal.js Kullanımı**
   - `apps/backend/src` dizininde `.add(`, `.sub(`, `.mul(`, `.div(` kullanımı var mı?
   - DOĞRU: `.plus()`, `.minus()`, `.times()`, `.dividedBy()`
   - YANLIŞ: `.add()`, `.sub()`, `.mul()`, `.div()`
   - Hatalı kullanım bulursan dosya yolu ve satır numarasını raporla

2. **Ledger Balance Kontrolü**
   - Her transaction için ledger entry'lerin DEBIT ve CREDIT toplamı eşit mi?
   - CommissionSnapshot'lardaki tutarlar ledger'a doğru yansımış mı?
   - Organization, Site, Partner, Financier account balance'ları ledger'la uyumlu mu?

3. **Commission Hesaplamaları**
   - Site: 6% (transaction amount * 0.06)
   - Partner: 1.5% (transaction amount * 0.015)
   - Financier: 2.5% (transaction amount * 0.025)
   - Organization: 2% (transaction amount * 0.02)
   - Toplam: 12% (hepsi toplandığında transaction amount'un %12'si olmalı)

4. **Running Balance Hesaplaması**
   - Site statistics'te aylık bakiye hesaplaması doğru mu?
   - Geriye doğru hesaplama yapılıyor mu? (current balance - month changes)
   - MonthlyStats array'inde eksik ay var mı?

## Critical Files to Check

- `apps/backend/src/modules/site/site.service.ts` (lines 480-520, 600-640)
- `apps/backend/src/modules/transaction/commission.service.ts`
- `apps/backend/src/modules/organization/organization.service.ts`
- `apps/backend/src/modules/partner/partner.service.ts`
- `apps/backend/src/modules/financier/financier.service.ts`
- `apps/backend/src/modules/ledger/ledger.service.ts`

## Rapor Formatı

Bulduğun her sorunu şu formatta raporla:

```
❌ HATA: [Dosya Yolu]:[Satır]
Sorun: [Açıklama]
Mevcut: [Hatalı kod]
Olmalı: [Doğru kod]
```

Sorun bulamazsan:

```
✅ TÜM FİNANSAL KONTROLLERDEN GEÇTİ
- Decimal.js kullanımı: ✓
- Ledger balance: ✓
- Commission hesaplamaları: ✓
- Running balance: ✓
```
