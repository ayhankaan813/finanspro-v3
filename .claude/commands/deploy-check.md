# Production Deployment Hazırlık Kontrolü

Production'a deploy etmeden önce tüm kritik noktaları kontrol et.

## 1. Code Quality

### TypeScript Compilation
```bash
cd apps/backend && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```
Hata var mı? Varsa düzelt.

### Build Test
```bash
cd apps/frontend && npm run build
```
Build başarılı mı? Bundle size makul mü? (<5MB)

## 2. Environment Configuration

### Backend .env Kontrolü
- `apps/backend/.env.example` güncel mi?
- Tüm gerekli environment variable'lar tanımlı mı?
- Sensitive data yok mu? (hardcoded password, API key vs.)

### Frontend .env Kontrolü
- `apps/frontend/.env.example` güncel mi?
- `NEXT_PUBLIC_API_URL` doğru mu?

## 3. Database

### Migration Kontrolü
```bash
cd apps/backend
npx prisma migrate status
```
Pending migration var mı?

### Schema Validation
```bash
cd apps/backend
npx prisma validate
```
Schema valid mi?

## 4. Security

### Dependency Audit
```bash
pnpm audit
```
High/Critical vulnerability var mı?

### CORS Configuration
- `apps/backend/src/app.ts` - CORS ayarları production-ready mi?
- Allowed origins doğru mu?

### Authentication
- JWT secret production'da farklı mı?
- Token expiry süreleri uygun mu?

## 5. Performance

### Database Queries
- N+1 problem var mı?
- Gerekli index'ler tanımlı mı?
- Prisma query'lerde `include` aşırı kullanılmış mı?

### Frontend Bundle
- Unused dependencies var mı?
- Code splitting yapılmış mı?
- Image optimization aktif mi?

## 6. Testing

### Critical Path Test
- Login çalışıyor mu?
- Transaction oluşturma çalışıyor mu?
- Commission calculation doğru mu?
- Report generation çalışıyor mu?

## 7. Documentation

### README
- Kurulum adımları güncel mi?
- Environment variables açıklanmış mı?
- API documentation var mı?

### Code Comments
- Complex business logic açıklanmış mı?
- TODOs var mı? Varsa listele.

## 8. Git

### Branch Status
```bash
git status
```
Uncommitted changes var mı?

### Remote Sync
```bash
git fetch origin
git status
```
Remote ile sync mi?

## Rapor Formatı

```
🚀 PRODUCTION DEPLOYMENT CHECKLIST
════════════════════════════════════

Code Quality:
├─ TypeScript: ✓ / ✗
├─ Frontend Build: ✓ / ✗
└─ Bundle Size: X MB

Environment:
├─ Backend .env.example: ✓ / ✗
└─ Frontend .env.example: ✓ / ✗

Database:
├─ Migrations: ✓ / ✗
└─ Schema: ✓ / ✗

Security:
├─ Dependencies: ✓ / ✗ (X vulnerabilities)
├─ CORS: ✓ / ✗
└─ Authentication: ✓ / ✗

Performance:
├─ Database Queries: ✓ / ✗
└─ Bundle Optimization: ✓ / ✗

Testing:
└─ Critical Paths: ✓ / ✗

Documentation:
├─ README: ✓ / ✗
└─ Code Comments: ✓ / ✗

Git:
├─ Clean Working Tree: ✓ / ✗
└─ Synced with Remote: ✓ / ✗

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Toplam: X/15 Kontrol Başarılı

DEPLOYMENT: ✅ HAZIR / ⚠️ SORUNLAR VAR / ❌ HAZIR DEĞİL
```

## Sorun Bulunan Her Item İçin

```
⚠️ [Kategori] - [Item]
Sorun: [Detaylı açıklama]
Çözüm: [Önerilen adımlar]
Kritiklik: 🔴 Blocker / 🟡 Warning / 🟢 Nice-to-have
```
