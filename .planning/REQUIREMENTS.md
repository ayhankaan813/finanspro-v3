# Requirements: FinansPro v3 — Kasalar Arası Borç/Alacak

**Defined:** 2026-02-28
**Core Value:** Finansörler arası borç/alacak ilişkisi her an net görünsün — kim kime ne kadar borçlu, toplam açık borç ne kadar, hangi ödemeler yapılmış.

## v1 Requirements

Requirements for milestone v1.1. Each maps to roadmap phases.

### Borç Yönetimi

- [x] **DEBT-01**: Finansörler arası borç verme/alma kaydı oluşturulabilir (borç veren, alan, tutar, tarih, açıklama)
- [x] **DEBT-02**: Açık borca karşı geri ödeme kaydedilebilir (kısmi veya tam)
- [x] **DEBT-03**: Yanlış girilen borç iptal edilebilir
- [x] **DEBT-04**: Borç ve ödemeye açıklama/not eklenebilir

### Borç/Alacak Sayfası

- [ ] **PAGE-01**: Borç/Alacak sayfasında özet dashboard görünür (toplam borç, toplam alacak, net durum, aktif borç sayısı)
- [ ] **PAGE-02**: Açık borçlar listesi görüntülenebilir (kapanmamış borçlar, kalan tutar, borç veren/alan taraflar)
- [ ] **PAGE-03**: İşlem geçmişi görüntülenebilir (tüm borç verme ve ödeme kayıtları kronolojik sırada)
- [ ] **PAGE-04**: Finansör çapraz tablosu (matrix) görüntülenebilir (kimin kime ne kadar borçlu olduğu)

### Finansör Detay Entegrasyonu

- [ ] **FDET-01**: Finansör detay sayfasında toplam borç/alacak özet kartı görünür
- [ ] **FDET-02**: Finansör detay sayfasında Borç/Alacak tab'ı ile ilgili borçlar ve ödemeler listelenir
- [ ] **FDET-03**: Finansör detay sayfasından 'Borç Ver/Al' hızlı işlem butonu ile yeni borç oluşturulabilir

## Future Requirements

### Borç Yönetimi Gelişmiş

- **DEBT-05**: Borç üzerinde faiz/komisyon hesaplama
- **DEBT-06**: Taksit planı oluşturma ve takip
- **DEBT-07**: Borç onay mekanizması (büyük tutarlar için)

### Raporlama

- **REPT-01**: Borç/alacak raporu PDF export
- **REPT-02**: Borç vade analizi ve uyarıları

## Out of Scope

| Feature | Reason |
|---------|--------|
| Faiz/komisyon hesaplama | İlk versiyonda karmaşıklık eklememek |
| Onay mekanizması | Admin tek kullanıcı, onay gereksiz |
| Ledger entegrasyonu | Borç/alacak ayrı tablo, mevcut muhasebe dışında |
| Taksit planı | Serbest ödeme modeli tercih edildi |
| Partner/site arası borç | Sadece finansörler arası |
| Faiz uyarıları/hatırlatmaları | Faiz yok, vade yok |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | Phase 5 | Complete |
| DEBT-02 | Phase 5 | Complete |
| DEBT-03 | Phase 5 | Complete |
| DEBT-04 | Phase 5 | Complete |
| PAGE-01 | Phase 6 | Pending |
| PAGE-02 | Phase 6 | Pending |
| PAGE-03 | Phase 6 | Pending |
| PAGE-04 | Phase 6 | Pending |
| FDET-01 | Phase 7 | Pending |
| FDET-02 | Phase 7 | Pending |
| FDET-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 — Traceability populated after roadmap creation*
