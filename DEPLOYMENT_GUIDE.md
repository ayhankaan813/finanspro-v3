# 🚀 FinansPro V3 — Deployment Rehberi

**Backend**: Railway (Fastify API + PostgreSQL)
**Frontend**: Vercel (Next.js)

---

## 📋 Ön Gereksinimler

- Railway hesabı (https://railway.app)
- Vercel hesabı (https://vercel.com)
- GitHub hesabı (repo push edilmiş olmalı)
- Railway CLI: `npm i -g @railway/cli`
- Vercel CLI: `npm i -g vercel`

---

## 🗄️ Adım 1: Backend Deploy (Railway)

### 1.1 Railway'e Giriş
```bash
railway login
```

### 1.2 Yeni Proje Oluştur
```bash
cd apps/backend
railway init
```
Proje adı: `finanspro-v3-backend`

### 1.3 PostgreSQL Ekle
Railway Dashboard'dan:
1. "New" → "Database" → "PostgreSQL" seç
2. Otomatik olarak `DATABASE_URL` env var'ı eklenir

### 1.4 Environment Variables Ayarla
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set HOST=0.0.0.0
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_ACCESS_EXPIRES_IN=4h
railway variables set JWT_REFRESH_EXPIRES_IN=7d
railway variables set LOG_LEVEL=info
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
```

> ⚠️ `DATABASE_URL` Railway tarafından PostgreSQL plugin'i ile otomatik set edilir!
> ⚠️ `JWT_SECRET` en az 32 karakter olmalı! Yukarıdaki komut otomatik üretir.

### 1.5 Deploy
```bash
railway up
```

Ya da otomatik deploy için Railway Dashboard → Settings → "Connect to GitHub Repo" → `apps/backend` root directory seç.

### 1.6 Doğrulama
```bash
# Health check
curl https://YOUR-BACKEND.railway.app/health

# Beklenen response:
# {"status":"ok","timestamp":"...","version":"3.4.0","environment":"production","database":"connected"}
```

### 1.7 Seed Data (İlk kez)
İlk deploy sonrası admin kullanıcı oluşturmak için:
```bash
railway run npx tsx prisma/seed.ts
```

---

## 🌐 Adım 2: Frontend Deploy (Vercel)

### 2.1 Vercel'e Giriş
```bash
vercel login
```

### 2.2 Deploy
```bash
cd apps/frontend
vercel
```

İlk kez sorduklarında:
- **Framework**: Next.js (otomatik algılar)
- **Root Directory**: `.` (zaten apps/frontend içindeyiz)

### 2.3 Environment Variables
Vercel Dashboard → Project Settings → Environment Variables:

| Key | Value | Environments |
|-----|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.railway.app` | Production, Preview |

### 2.4 Production Deploy
```bash
vercel --prod
```

### 2.5 CORS Güncelle
Backend'de CORS'u frontend URL'si ile güncelle:
```bash
cd apps/backend
railway variables set CORS_ORIGIN=https://your-app.vercel.app
railway up
```

---

## 🔄 Otomatik Deploy (CI/CD)

### Railway (Backend)
1. Railway Dashboard → Service → Settings → "Connect GitHub Repo"
2. Branch: `main`
3. Root Directory: `apps/backend`
4. Her push otomatik deploy olur

### Vercel (Frontend)
1. Vercel Dashboard → Project → Settings → Git
2. Branch: `main`
3. Root Directory: `apps/frontend`
4. Her push otomatik deploy olur

---

## 🩺 Health Check & Monitoring

### Backend Health
```bash
curl https://YOUR-BACKEND.railway.app/health
```

### Railway Logları
```bash
cd apps/backend
railway logs --follow
```

### Vercel Logları
```bash
cd apps/frontend
vercel logs --follow
```

---

## 📊 Production Checklist

- [ ] PostgreSQL veritabanı oluşturuldu (Railway)
- [ ] `DATABASE_URL` otomatik set edildi
- [ ] `JWT_SECRET` 32+ karakter, rastgele üretildi
- [ ] `CORS_ORIGIN` frontend Vercel URL'si ile ayarlandı
- [ ] `NEXT_PUBLIC_API_URL` backend Railway URL'si ile ayarlandı
- [ ] Backend health check çalışıyor (`/health`)
- [ ] Frontend build başarılı
- [ ] Login test edildi (admin@finanspro.com)
- [ ] Seed data yüklendi (ilk kez)
- [ ] Custom domain eklendi (opsiyonel)

---

## 🔐 Güvenlik Notları

1. **JWT_SECRET**: Her ortam için farklı, rastgele üretilmiş 64 karakter
2. **DATABASE_URL**: Asla commit etmeyin, Railway otomatik sağlar
3. **CORS_ORIGIN**: Sadece frontend URL'si — `*` kullanmayın
4. **Rate Limiting**: 100 request/dakika (production default)
5. **Helmet**: Güvenlik headerları otomatik eklenir

---

## 🆘 Troubleshooting

### Build Hatası
```bash
# Backend build test
cd apps/backend && npm run build

# Frontend build test
cd apps/frontend && npx next build
```

### DB Bağlantı Sorunu
```bash
# Railway'de DB URL'yi kontrol et
railway variables | grep DATABASE_URL
```

### CORS Hatası
Backend'de CORS_ORIGIN'i kontrol edin:
```bash
railway variables | grep CORS
# Frontend URL ile eşleşmeli
```

### Migration Sorunu
```bash
railway run npx prisma migrate deploy
```

---

## 📌 URL'ler (deploy sonrası güncellenecek)

| Servis | URL |
|--------|-----|
| Backend API | `https://XXX.railway.app` |
| Frontend | `https://XXX.vercel.app` |
| Health Check | `https://XXX.railway.app/health` |
| API Docs (dev) | `http://localhost:3001/docs` |

---

## 🔄 Eski v2'den Geçiş

v2 Railway projesini silip v3'ü deploy etmek için:

1. Railway Dashboard → Eski proje → Settings → "Delete Project"
2. Yeni proje oluştur (Adım 1'den devam)
3. PostgreSQL ekle
4. Seed data yükle
5. Vercel'de root directory'yi `frontend` → `apps/frontend` olarak güncelle
6. Environment variable'ları güncelle

> ⚠️ Eski veritabanı silindikten sonra geriye dönüş yoktur!
> Gerekirse önce export alın.
