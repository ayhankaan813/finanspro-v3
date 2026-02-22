# FinansPro v3 - Development Roadmap

**Son Guncelleme:** 22 Subat 2026
**Mevcut Versiyon:** 3.2.0

---

## Genel Bakis

```
Temel Altyapi      : %100
Muhasebe Sistemi   : %100
Frontend UI        : %95
Mobil Uyum         : %90
Dark Mode          : %40 (rapor sayfalari tamamlandi)
Test & QA          : %30
Dokumantasyon      : %85
```

### Sistem
- **Backend:** http://localhost:3001 (Fastify 4 + Prisma 6)
- **Frontend:** http://localhost:3000 (Next.js 15)
- **Database:** PostgreSQL 17
- **API Docs:** http://localhost:3001/docs

---

## Modul Durumu

### Backend Modulleri (14 adet)

| Modul | Durum | Aciklama |
|-------|-------|----------|
| auth | Tamamlandi | JWT login, role-based access |
| site | Tamamlandi | Site CRUD, bakiye, istatistik |
| partner | Tamamlandi | Partner CRUD, hak edis |
| financier | Tamamlandi | Finansor CRUD, bloke takibi |
| external-party | Tamamlandi | Dis kisi CRUD, borc takibi |
| organization | Tamamlandi | Org analytics, bakiye |
| transaction | Tamamlandi | 14 islem tipi, approval workflow |
| ledger | Tamamlandi | Double-entry, bakiye hesaplama |
| balance | Tamamlandi | Bakiye hesaplama servisi |
| settings | Tamamlandi | Komisyon oranlari |
| approval | Tamamlandi | Islem onay workflow |
| notification | Tamamlandi | Panel ici bildirimler |
| personnel | Tamamlandi | Personel, maas, avans |
| report | Tamamlandi | Rapor uretimi |

### Frontend Sayfalari (22+ adet)

| Sayfa | Yol | Durum | Dark Mode | Mobil |
|-------|-----|-------|-----------|-------|
| Dashboard | /dashboard | Tamamlandi | Hayir | Evet |
| Islemler | /transactions | Tamamlandi | Hayir | Evet |
| Bulk Import | /transactions/import | Tamamlandi | Hayir | Evet |
| Siteler | /sites | Tamamlandi | Hayir | Evet |
| Site Detay | /sites/[id] | Tamamlandi | Hayir | Evet |
| Partnerler | /partners | Tamamlandi | Hayir | Evet |
| Partner Detay | /partners/[id] | Tamamlandi | Hayir | Evet |
| Finansorler | /financiers | Tamamlandi | Hayir | Evet |
| Finansor Detay | /financiers/[id] | Tamamlandi | Hayir | Evet |
| Dis Kisiler | /external-parties | Tamamlandi | Hayir | Evet |
| Dis Kisi Detay | /external-parties/[id] | Tamamlandi | Hayir | Evet |
| Organizasyon | /organization | Tamamlandi | Hayir | Evet |
| Personel | /organization/personnel | Tamamlandi | Hayir | Evet |
| Kasa Raporu | /reports/kasa-raporu | Tamamlandi | Evet | Evet |
| Mutabakat | /reports/reconciliation | Tamamlandi | Evet | Evet |
| Analiz | /reports/analysis | Tamamlandi | Evet | Evet |
| Onay Bekleyenler | /approvals | Tamamlandi | Hayir | Evet |
| Ayarlar | /settings | Tamamlandi | Hayir | Evet |

---

## Komisyon Yapisi (Sabit)

```
Site:         %6     (musteri komisyonu)
Partner:      %1.5   (partner hak edisi)
Finansor:     %2.5   (otomatik kesilir, deftere girmez)
Organizasyon: %2     (organizasyon kari)
Toplam:       %12
```

**Muhasebe Kurali:**
- Finansor komisyonu (2.5%) otomatik kesilir
- Muhasbeleistirilen tutar: brut x 0.975
- DEBIT toplami = CREDIT toplami (her zaman)
- Site = LIABILITY, Finansor/Org = ASSET

---

## Son Degisiklikler (Subat 2026)

### 22 Subat - UI Redesign
- Mutabakat sayfasi: org bakiyesi eklendi, denge cubugu, dark mode, YZ karti kaldirildi
- Analiz sayfasi: tutarli header, gereksiz API cagrilari kaldirildi, dark mode
- Dokumantasyon guncellendi (README, CHANGELOG, ROADMAP)

### 21 Subat - Mobile Optimization
- Finansor/partner/site detay sayfalari mobil optimize edildi
- Finansor istatistik buglari duzeltildi

### 20 Subat - Timezone & Fixes
- Turkey timezone (GMT+3) tum tarih gosterimleri
- Webpack watchOptions 404 sorunu duzeltildi
- Webpack dev derleme optimizasyonu

### 19 Subat - Security & Performance
- Kapsamli guvenlik hardening
- @fastify/compress Fastify 4.x uyumlulugu

### 18 Subat - Personel & External
- Personel modulu (maas/avans takibi)
- Dis kisi detay sayfasi + kasa defteri
- Bulk import iyilestirmeleri

### 11-12 Subat - Muhasebe & Onay Sistemi
- Muhasebe mantigi yeniden yazildi
- Site → LIABILITY siniflandirmasi
- Komisyon validasyonu
- 14 islem tipine onay workflow
- Bildirim sistemi
- Admin transaction edit

---

## Yapilacaklar

### Yuksek Oncelik
- [ ] Tum sayfalara dark mode
- [ ] Manuel test - muhasebe sistemi
- [ ] Production deployment hazirligi

### Orta Oncelik
- [ ] Unit/integration test coverage (%80 hedef)
- [ ] Error boundaries (frontend)
- [ ] Rate limiting (backend)
- [ ] CORS yapilandirmasi (production)

### Dusuk Oncelik
- [ ] Multi-tenant support
- [ ] Excel/PDF export
- [ ] Email/SMS notifications
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Internationalization

---

## Kritik Dosyalar

### Muhasebe Katmani
- `apps/backend/src/modules/transaction/transaction.service.ts` - 14 islem tipi
- `apps/backend/src/modules/transaction/commission.service.ts` - Komisyon hesaplama + validasyon
- `apps/backend/src/modules/ledger/ledger.service.ts` - Ledger entries, bakiye hesaplama

### Onay Sistemi
- `apps/backend/src/modules/approval/approval.service.ts` - Onay workflow
- `apps/backend/src/modules/notification/notification.service.ts` - Bildirim servisi

### Frontend Hooks
- `apps/frontend/src/hooks/use-api.ts` - Tum React Query hooks (35+)

---

## Decimal.js Kurallari

**ZORUNLU:** Finansal hesaplamalarda sadece Decimal.js metotlari kullanilir.

```typescript
// DOGRU:
amount.plus(other)       // toplama
amount.minus(other)      // cikarma
amount.times(rate)       // carpma
amount.dividedBy(count)  // bolme

// YANLIS (ASLA KULLANMA):
amount.add(other)        // YOK
amount.sub(other)        // YOK
amount.mul(rate)         // YOK
amount.div(count)        // YOK
```

---

**Son Guncelleme:** 22 Subat 2026
**Versiyon:** 3.2.0
