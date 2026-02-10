# Finansal Test Senaryosu

Manuel test senaryosunu otomatik çalıştır ve sonuçları doğrula.

## Test Adımları

### 1. Environment Kontrolü
- PostgreSQL çalışıyor mu? (`pg_isready -h localhost -p 5432`)
- Database var mı? (`finanspro_v3`)

### 2. Servisleri Durdur
- Çalışan tüm backend ve frontend process'leri durdur
- Port 3000 ve 3001 boş olmalı

### 3. Database Reset
```bash
cd apps/backend
npx prisma db push --force-reset --accept-data-loss
```

### 4. Seed Data Yükle
```bash
cd apps/backend
node --import tsx prisma/seed.ts
```

### 5. Backend Başlat
```bash
cd apps/backend
npm run dev
# 3 saniye bekle
```

### 6. Frontend Başlat
```bash
cd apps/frontend
npm run dev
```

### 7. API Endpoint Testleri

Test et ve sonuçları raporla:

**Organization Endpoints:**
- `GET /api/organization/balance` → Beklenen: 22.00 TL
- `GET /api/organization/analytics?year=2025` → profitBySite, busyDays, monthlyTrend olmalı

**Site Endpoints:**
- `GET /api/sites` → NISAN site'ı olmalı
- `GET /api/sites/{id}/statistics?year=2025` → Ocak ayı bakiyesi 0.00 olmalı

**Partner Endpoints:**
- `GET /api/partners` → Ahmet Yılmaz olmalı
- `GET /api/partners/{id}/balance` → Balance hesaplanabilmeli

**Financier Endpoints:**
- `GET /api/financiers` → Test financier olmalı
- `GET /api/financiers/{id}/balance` → Balance hesaplanabilmeli

### 8. Sonuç Raporu

```
🧪 FİNANSAL TEST SONUÇLARI
═══════════════════════════

Database: ✓ / ✗
Seed Data: ✓ / ✗
Backend: ✓ / ✗ (Port 3001)
Frontend: ✓ / ✗ (Port 3000)

API Endpoints:
- Organization Balance: ✓ / ✗ (Beklenen: 22.00, Gelen: X)
- Organization Analytics: ✓ / ✗
- Sites List: ✓ / ✗
- Site Statistics: ✓ / ✗
- Partners List: ✓ / ✗
- Financiers List: ✓ / ✗

Toplam: X/8 Test Başarılı
```

## Hata Durumunda

Herhangi bir test başarısız olursa:
1. Hata mesajını tam olarak göster
2. İlgili log'ları göster
3. Muhtemel çözümü öner
