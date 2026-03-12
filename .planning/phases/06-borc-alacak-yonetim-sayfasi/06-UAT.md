---
status: complete
phase: 06-borc-alacak-yonetim-sayfasi
source: 06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md
started: 2026-03-01T14:00:00Z
updated: 2026-03-01T15:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Sidebar Navigation Entry
expected: Sidebar'da HESAPLAR grubunda "Borc/Alacak" menu itemi gorunur (HandCoins ikonu ile). Tiklandiginda /borclar sayfasina yonlendirir.
result: pass

### 2. Summary Cards Display
expected: /borclar sayfasinda 4 ozet karti gorunur — Toplam Borc (kirmizi), Toplam Alacak (yesil), Net Durum (mavi, pozitifse yesil negatifse kirmizi deger), Aktif Borc (amber). Tum tutarlar TL formatinda ve mono fontla gosterilir.
result: skipped
reason: Borc sistemi tasarim degisikligi gerekiyor — finansor-only veri yanlis entity tiplerinden geldigi icin kartlar yanlis veri gosterir

### 3. Acik Borclar Tab - Debt Table
expected: Acik Borclar sekmesinde filtrelenebilir borc tablosu gorunur. Finansor ve durum filtreleri mevcut. Her satir ilerleme cubugu (progress bar) gosterir. Satirlara tiklandiginda detay alanina genisler.
result: skipped
reason: Tasarim degisikligi — tablo sadece finansor borclari gosteriyor, partner/dis kisi/org borclari yok

### 4. Expandable Row Detail
expected: Bir borc satirina tiklandiginda odeme gecmisi ve aksiyon butonlari (Odeme Yap, Iptal Et) gorunur. Odeme yoksa Iptal butonu gosterilir, odeme varsa gizlenir.
result: skipped
reason: Tasarim degisikligi gerektiren ana issue'a bagli

### 5. Create Debt Dialog
expected: Header'daki "Yeni Borc" butonuna tiklandiginda dialog acilir. Alacakli ve borclu secimi yapilabilir (ayni kisi secilemez). Tutar ve aciklama girilir. Kaydedildiginde liste guncellenir.
result: issue
reported: "Dialog sadece finansorleri gosteriyor. Borc sistemi finansorler arasi degil, partner-dis kisi, organizasyon-partner gibi tum entity tipleri arasinda olmali. Izleme/takip hesabi mantigi ile calismali — muhasebe programi gibi."
severity: blocker

### 6. Payment Dialog
expected: Acik bir borcta "Odeme Yap" butonuna tiklandiginda odeme dialogu acilir. Kalan tutar gosterilir. "Tamami Ode" butonu ile kalan tutar otomatik dolar. Odeme yapildiginda ilerleme cubugu guncellenir.
result: skipped
reason: Tasarim degisikligi gerektiren ana issue'a bagli

### 7. Cancel Debt Dialog
expected: Odemesi olmayan bir borcu iptal etmek icin "Iptal Et" butonuna tiklandiginda uyari ikonu ile onay dialogu acilir. Opsiyonel iptal nedeni girilebilir. Iptal sonrasi borc listeden kalkar.
result: skipped
reason: Tasarim degisikligi gerektiren ana issue'a bagli

### 8. Islem Gecmisi Tab
expected: Islem Gecmisi sekmesinde tum borclar kronolojik sirada tablo halinde listelenir.
result: skipped
reason: Tasarim degisikligi gerektiren ana issue'a bagli

### 9. Finansor Matrix Tab
expected: Finansor Matrix sekmesinde cros-table gorunur — satirlar alacakli, sutunlar borclu. Hucrelerde tutarlar isi haritasi (heat map) renklendirmesiyle gosterilir. Kosegen hucreler devre disi (em-dash). Satir/sutun toplamlari ve genel toplam mevcut.
result: skipped
reason: Matrix sadece finansorler arasi — tum entity tipleri icin genisletilmeli

### 10. Matrix Color Legend
expected: Matrix tablosunun altinda renk aciklamasi gorunur — Kendisi / Dusuk / Orta / Yuksek seviyeleri farkli renklerle.
result: skipped
reason: Tasarim degisikligi gerektiren ana issue'a bagli

### 11. Loading States
expected: Sayfa yuklenirken ozet kartlari ve tablo icerikleri skeleton (placeholder) animasyonlari gosterir.
result: pass

### 12. React Key Warning
expected: Console'da hata olmamali
result: issue
reported: "Console'da React key hatasi: 'Each child in a list should have a unique key prop' — borclar/page.tsx satir 568, TableBody icinde Fragment (<>) key almamis"
severity: minor

## Summary

total: 12
passed: 2
issues: 2
pending: 0
skipped: 8

## Gaps

- truth: "Borc sistemi tum entity tipleri arasinda calismali (partner, dis kisi, organizasyon, finansor)"
  status: failed
  reason: "User reported: Dialog sadece finansorleri gosteriyor. Borc sistemi finansorler arasi degil, partner-dis kisi, organizasyon-partner gibi tum entity tipleri arasinda olmali. Izleme/takip hesabi mantigi ile calismali — muhasebe programi gibi."
  severity: blocker
  test: 5
  artifacts: []
  missing: []

- truth: "Console'da React hatasi olmamali"
  status: failed
  reason: "User reported: Console'da React key hatasi — borclar/page.tsx satir 568, TableBody icinde Fragment key almamis"
  severity: minor
  test: 12
  artifacts: []
  missing: []
