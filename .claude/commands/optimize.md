# Performance Optimization Analizi

Projedeki performans sorunlarını tespit et ve optimizasyon önerileri sun.

## Backend Performance

### 1. Database Query Analysis

**N+1 Problem Kontrolü:**
`apps/backend/src/modules/**/*.service.ts` dosyalarında:
- `findMany` içinde loop'ta `findUnique` var mı?
- İlişkili data için `include` kullanılıyor mu yoksa ayrı query'ler mi?

**Önerilen Pattern:**
```typescript
// ❌ YANLIŞ - N+1
const sites = await prisma.site.findMany();
for (const site of sites) {
  const partner = await prisma.partner.findUnique({ where: { id: site.partner_id } });
}

// ✅ DOĞRU
const sites = await prisma.site.findMany({
  include: { partner: true }
});
```

### 2. Index Analysis

`apps/backend/prisma/schema.prisma` kontrol et:
- Frequently queried fields'larda `@@index` var mı?
- Foreign key'lerde index var mı?
- Composite index'ler gerekli mi?

**Kritik Index'ler:**
- `Transaction.transaction_date`
- `Transaction.source_id + source_type`
- `LedgerEntry.account_id + created_at`
- `CommissionSnapshot.created_at`

### 3. Prisma Query Optimization

**Select Field Optimization:**
Tüm field'ları çekmek yerine sadece gerekli olanları:
```typescript
// ❌ YANLIŞ
const transactions = await prisma.transaction.findMany();

// ✅ DOĞRU
const transactions = await prisma.transaction.findMany({
  select: {
    id: true,
    net_amount: true,
    transaction_date: true,
  }
});
```

### 4. Decimal.js Performance

Gereksiz Decimal dönüşümü var mı?
```typescript
// ❌ YANLIŞ
const amount = new Decimal(100);
const result = amount.plus(new Decimal(50)).plus(new Decimal(25));

// ✅ DOĞRU
const amount = new Decimal(100);
const result = amount.plus(50).plus(25);
```

## Frontend Performance

### 1. React Query Cache Optimization

`apps/frontend/src/hooks/use-api.ts` kontrol et:

**Stale Time Settings:**
```typescript
// Financial data - 5 dakika
staleTime: 5 * 60 * 1000

// Static data (settings) - 30 dakika
staleTime: 30 * 60 * 1000

// Real-time data (balance) - 30 saniye
staleTime: 30 * 1000
```

### 2. Component Re-render Analysis

`apps/frontend/src/app/**/*.tsx` kontrol et:

**Gereksiz Re-render:**
- `useEffect` dependency array'leri doğru mu?
- Heavy computation için `useMemo` kullanılmış mı?
- Callback functions için `useCallback` kullanılmış mı?

**Önerilen Pattern:**
```typescript
// ❌ YANLIŞ
const expensiveCalc = data.map(item => heavyProcess(item));

// ✅ DOĞRU
const expensiveCalc = useMemo(
  () => data.map(item => heavyProcess(item)),
  [data]
);
```

### 3. Bundle Size Analysis

```bash
cd apps/frontend
npm run build
```

**Kontrol Et:**
- First Load JS < 200 KB mı?
- Route-based code splitting yapılmış mı?
- Unused dependencies var mı?

**Large Dependencies:**
```bash
npx bundle-analyzer
```
Sonuçları analiz et ve gereksiz/büyük paketleri tespit et.

### 4. Chart Performance

Recharts kullanımında:
- Data point sayısı > 100 ise virtualization gerekli mi?
- Tooltip render performance'ı optimize edilmiş mi?
- ResponsiveContainer gereksiz re-render'a sebep oluyor mu?

## Database Performance

### 1. Connection Pool

`apps/backend/src/shared/prisma/client.ts`:
```typescript
datasources: {
  db: {
    url: env.DATABASE_URL
  }
}

// Connection pool settings
connection_limit = 10
pool_timeout = 30
```

### 2. Query Execution Time

Slow query logging aktif mi?
PostgreSQL'de:
```sql
-- Log queries slower than 1000ms
SET log_min_duration_statement = 1000;
```

## API Response Time

### 1. Endpoint Benchmarking

Her endpoint için response time ölç:
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/organization/balance
```

**Hedef Response Times:**
- Simple queries: < 100ms
- Complex analytics: < 500ms
- Reports: < 2000ms

### 2. Caching Strategy

Hangi endpoint'lerde caching yararlı olur?
- Organization analytics (5 dakika cache)
- Site statistics (10 dakika cache)
- Commission rates (30 dakika cache)

## Rapor Formatı

```
⚡ PERFORMANCE OPTIMIZATION RAPORU
════════════════════════════════════

Backend:
├─ N+1 Queries: X found
├─ Missing Indexes: X
├─ Decimal Optimization: X issues
└─ Avg Response Time: Xms

Frontend:
├─ Bundle Size: X KB (Target: 200 KB)
├─ Re-render Issues: X components
├─ React Query Cache: ✓ / ✗
└─ Chart Performance: ✓ / ✗

Database:
├─ Connection Pool: ✓ / ✗
├─ Slow Queries: X found
└─ Index Coverage: X%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority Optimizations:

🔴 HIGH PRIORITY:
1. [Detay]
2. [Detay]

🟡 MEDIUM PRIORITY:
1. [Detay]
2. [Detay]

🟢 LOW PRIORITY:
1. [Detay]
2. [Detay]

Estimated Performance Gain: X%
```

Her sorun için:
```
📊 [Kategori] - [Dosya:Satır]
Sorun: [Açıklama]
Mevcut: [Kod snippet]
Optimize: [Önerilen kod]
Gain: ~X% faster / -X KB bundle
```
