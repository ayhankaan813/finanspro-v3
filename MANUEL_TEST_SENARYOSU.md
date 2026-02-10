# FinansPro v3 - Manuel Test Senaryosu

## 🎯 Test Öncesi Hazırlık

### Sistem Durumu
- ✅ Backend: http://localhost:3001 (Çalışıyor)
- ✅ Frontend: http://localhost:3000 (Çalışıyor)
- ✅ Database: PostgreSQL (Bağlı)
- ✅ API Docs: http://localhost:3001/docs

### Giriş Bilgileri
- **Email:** admin@finanspro.com
- **Şifre:** admin123

---

## 📋 Test Aşamaları ve Durumu

### Faz 1: Temel Sistem Özellikleri ✅

#### ✅ Son Tamamlanan Geliştirmeler
1. **Komisyon Sistemi** - Versiyonlama ile tamamlandı
2. **Site Detay Sayfası** - Aylık/Günlük görünüm eklendi
3. **Partner Detay Sayfası** - İş mantığı tamamlandı
4. **Finansör Ekleme Butonu** - Modal ile çalışır hale getirildi
5. **Finansör Detay Sayfası** - YATIRIM ve ÇEKİM kolonları eklendi

---

## 🔥 KRİTİK TEST NOKTALARI (Öncelikli)

### 1. Finansör Modülü ⚠️ YENİ EKLENEN

#### Test 1.1: Finansör Listesi
**Adımlar:**
1. Dashboard'a giriş yap
2. Sol menüden "Finansörler" sayfasına git
3. Listenin yüklendiğini kontrol et

**Kontrol Edilecekler:**
- [ ] Finansör listesi görüntüleniyor mu?
- [ ] Bakiye bilgileri doğru mu?
- [ ] Aktif bloke sayıları görünüyor mu?
- [ ] "Finansör Oluştur" butonu çalışıyor mu?

#### Test 1.2: Finansör Oluşturma ⚠️ YENİ
**Adımlar:**
1. "Finansör Oluştur" butonuna tıkla
2. Aşağıdaki bilgileri gir:
   - Ad: "Test Finansör"
   - Kod: Otomatik oluşturulacak (ör: FIN-001)
   - Açıklama: "Test amaçlı oluşturuldu"
3. "Oluştur" butonuna tıkla

**Kontrol Edilecekler:**
- [ ] Modal açılıyor mu?
- [ ] Kod otomatik oluşturuluyor mu?
- [ ] Form validasyonu çalışıyor mu?
- [ ] Finansör başarıyla oluşturuluyor mu?
- [ ] Liste güncellenip yeni finansör görünüyor mu?

#### Test 1.3: Finansör Detay Sayfası ⚠️ YENİ DÜZELTİLDİ
**Adımlar:**
1. Finansör listesinden herhangi bir finansöre tıkla
2. Detay sayfasını incele

**Kontrol Edilecekler:**
- [ ] Sayfa yükleniyor mu?
- [ ] Üst kısımda 3 bakiye kartı görünüyor mu?
  - Toplam Bakiye
  - Müsait Bakiye
  - Blokeli Tutar
- [ ] "Aylık Görünüm" / "Günlük Görünüm" toggle çalışıyor mu?
- [ ] **KRİTİK:** Tabloda 8 kolon var mı?
  - TARİH
  - YATIRIM (yeşil, TrendingUp icon) ⚠️ YENİ
  - ÇEKİM (kırmızı, TrendingDown icon) ⚠️ YENİ
  - ÖDEME (mor, Banknote icon)
  - TAKVİYE (mavi, ArrowUpFromLine icon)
  - KOMİSYON (turuncu, HandCoins icon)
  - BLOKELİ (sarı, Lock icon)
  - BAKİYE (yeşil/kırmızı, Wallet icon)

**İş Mantığı Kontrolü:**
- [ ] Finansörün yaptığı YATIRIMLAR görünüyor mu?
- [ ] Finansörün yaptığı ÇEKİMLER görünüyor mu?
- [ ] Komisyon, YATIRIM ve ÇEKİM'den hesaplanıyor mu?
- [ ] Bakiye = Komisyon + Takviye - Ödeme formülü doğru mu?

#### Test 1.4: Aktif Blokeler Bölümü
**Kontrol Edilecekler:**
- [ ] Eğer finansörde bloke varsa "Aktif Blokeler" bölümü görünüyor mu?
- [ ] Her bloke için tutar, başlangıç tarihi, geçen gün görünüyor mu?

---

### 2. Site Modülü

#### Test 2.1: Site Listesi
**Adımlar:**
1. Sol menüden "Siteler" sayfasına git
2. Listenin yüklendiğini kontrol et

**Kontrol Edilecekler:**
- [ ] Site listesi görüntüleniyor mu?
- [ ] Bakiye bilgileri negatif (borç) gösteriliyor mu?
- [ ] "Site Oluştur" butonu var mı?

#### Test 2.2: Site Detay Sayfası
**Adımlar:**
1. Herhangi bir siteye tıkla
2. Detay sayfasını incele

**Kontrol Edilecekler:**
- [ ] Sayfa yükleniyor mu?
- [ ] Aylık/Günlük görünüm toggle çalışıyor mu?
- [ ] Tabloda kolonlar doğru mu?
  - TARİH
  - PARA GİRİŞİ
  - PARA ÇIKIŞI
  - ÖDEME
  - TAKVİYE
  - KOMİSYON
  - TESLİMAT
  - TES.KOMİS
  - BAKİYE

**İş Mantığı Kontrolü:**
- [ ] Para Girişi = DEPOSIT + TOPUP
- [ ] Para Çıkışı = WITHDRAWAL + PAYMENT + DELIVERY
- [ ] Bakiye negatif (borç) olarak gösteriliyor mu?

---

### 3. Partner Modülü

#### Test 3.1: Partner Listesi
**Adımlar:**
1. Sol menüden "Partnerler" sayfasına git
2. Listenin yüklendiğini kontrol et

**Kontrol Edilecekler:**
- [ ] Partner listesi görüntüleniyor mu?
- [ ] Aktif site sayıları görünüyor mu?
- [ ] Bakiye bilgileri doğru mu?

#### Test 3.2: Partner Detay Sayfası
**Adımlar:**
1. Herhangi bir partnere tıkla
2. Detay sayfasını incele

**Kontrol Edilecekler:**
- [ ] Sayfa yükleniyor mu?
- [ ] Aylık/Günlük görünüm toggle çalışıyor mu?
- [ ] Tabloda kolonlar doğru mu?
  - TARİH
  - PARA GİRİŞİ
  - PARA ÇIKIŞI
  - TESLİMAT
  - TES.KOMİS
  - KOMİSYON
  - BAKİYE

**İş Mantığı Kontrolü:**
- [ ] Para Girişi = Partner'a yapılan ödemeler
- [ ] Para Çıkışı = Partner'ın siteye yaptığı işlemler
- [ ] Teslimat komisyonu ayrı hesaplanıyor mu?

---

### 4. Komisyon Sistemi ⚠️ YENİ SİSTEM

#### Test 4.1: Site Komisyon Ayarları
**Adımlar:**
1. Herhangi bir site detay sayfasına git
2. Sağ üstte "Komisyon Ayarları" butonuna tıkla
3. Modal'ı incele

**Kontrol Edilecekler:**
- [ ] Modal açılıyor mu?
- [ ] 4 işlem tipi için komisyon oranları gösteriliyor mu?
  - DEPOSIT
  - WITHDRAWAL
  - PAYMENT
  - TOPUP
- [ ] Her oran için geçerlilik tarihleri var mı?
- [ ] "Yeni Komisyon Ekle" butonu çalışıyor mu?

#### Test 4.2: Yeni Komisyon Ekleme
**Adımlar:**
1. "Yeni Komisyon Ekle" butonuna tıkla
2. İşlem tipi seç (ör: DEPOSIT)
3. Oran gir (ör: 0.02 = %2)
4. Geçerlilik tarihi seç
5. "Kaydet" butonuna tıkla

**Kontrol Edilecekler:**
- [ ] Form açılıyor mu?
- [ ] Geçerlilik tarihi bugünden önce olamaz kontrolü var mı?
- [ ] Yeni oran başarıyla kaydediliyor mu?
- [ ] Eski oran otomatik pasif mi oluyor?

#### Test 4.3: Komisyon Versiyonlama
**Kontrol Edilecekler:**
- [ ] Aynı işlem tipi için birden fazla tarihli komisyon tanımlanabiliyor mu?
- [ ] Eski komisyonlar "Geçmiş Komisyonlar" bölümünde görünüyor mu?
- [ ] Gelecek tarihli komisyonlar ayarlanabiliyor mu?

---

### 5. Dashboard ve Raporlar

#### Test 5.1: Ana Dashboard
**Adımlar:**
1. Ana sayfaya git (/)

**Kontrol Edilecekler:**
- [ ] Sayfa yükleniyor mu?
- [ ] Özet kartlar görünüyor mu?
  - Toplam Siteler
  - Toplam Partnerler
  - Toplam Finansörler
  - Toplam İşlemler
- [ ] Grafikler var mı?

#### Test 5.2: Mutabakat Sayfası ⚠️ YENİ DÜZELTİLDİ
**Adımlar:**
1. Sol menüden "Raporlar" > "Mutabakat" sayfasına git

**Kontrol Edilecekler:**
- [ ] Sayfa yükleniyor mu? (Build hatası düzeltildi)
- [ ] "Varlıklar" ve "Yükümlülük" daireler görünüyor mu?
- [ ] NET POZİSYON hesaplanıyor mu?
- [ ] 4 kart görünüyor mu?
  - Nakit Varlıklar (Finansörler)
  - Site Borçları
  - Partner Hak Ediş
  - Dış Hesaplar
- [ ] Likidite Karşılama oranı gösteriliyor mu?

---

## 🚨 MANUEL TEST SÜRECİ

### Adım 1: Temel Giriş ve Navigasyon (5 dk)
1. [ ] Tarayıcıda http://localhost:3000 aç
2. [ ] Login sayfası görünüyor mu?
3. [ ] Admin bilgileriyle giriş yap
4. [ ] Dashboard yükleniyor mu?
5. [ ] Sol menüden tüm sayfalara erişebiliyor musun?
   - Dashboard
   - Siteler
   - Partnerler
   - Finansörler
   - İşlemler
   - Onaylar
   - Raporlar
   - Ayarlar

### Adım 2: Finansör Modülü Testi (10 dk) ⚠️ ÖNCELİKLİ
1. [ ] Finansörler sayfasına git
2. [ ] "Finansör Oluştur" butonuna tıkla ve yeni finansör ekle
3. [ ] Oluşturduğun finansöre tıkla ve detay sayfasını aç
4. [ ] **KRİTİK:** Tabloda YATIRIM ve ÇEKİM kolonları görünüyor mu?
5. [ ] Aylık görünümde bir aya tıkla, günlük görünüme geç
6. [ ] Üstteki 6 stat kartının değerleri doğru mu?
7. [ ] Eğer bloke varsa "Aktif Blokeler" bölümünü kontrol et

### Adım 3: Site Modülü Testi (10 dk)
1. [ ] Siteler sayfasına git
2. [ ] Herhangi bir siteye tıkla
3. [ ] Detay sayfasında aylık/günlük görünüm değiştir
4. [ ] "Komisyon Ayarları" butonuna tıkla
5. [ ] Mevcut komisyonları incele
6. [ ] Yeni bir komisyon oranı ekle
7. [ ] Komisyonun kaydedildiğini kontrol et

### Adım 4: Partner Modülü Testi (10 dk)
1. [ ] Partnerler sayfasına git
2. [ ] Herhangi bir partnere tıkla
3. [ ] Detay sayfasında verileri kontrol et
4. [ ] Aylık görünümden aya tıkla, günlük görünüme geç
5. [ ] Teslimat ve komisyon hesaplamalarını kontrol et

### Adım 5: Mutabakat Raporu Testi (5 dk) ⚠️ YENİ DÜZELTİLDİ
1. [ ] Raporlar > Mutabakat sayfasına git
2. [ ] Sayfa hatasız yükleniyor mu?
3. [ ] Varlık-Yükümlülük dengesi görünüyor mu?
4. [ ] 4 kategori kartı verilerle dolu mu?
5. [ ] Likidite oranı mantıklı görünüyor mu?

### Adım 6: Genel Stabilite Testi (10 dk)
1. [ ] Sayfalar arası hızlı geçiş yap
2. [ ] Console'da hata var mı kontrol et (F12)
3. [ ] Network tab'de başarısız request var mı?
4. [ ] Loading state'ler düzgün çalışıyor mu?
5. [ ] Responsive tasarım mobilde nasıl görünüyor?

---

## ⚠️ BİLİNEN SINIRLAMALAR

### Henüz Uygulanmamış Özellikler
- [ ] İşlem oluşturma sayfası (manual transaction)
- [ ] Bloke ekleme/çıkarma işlemi
- [ ] Kullanıcı yönetimi
- [ ] Excel export özelliği
- [ ] Bildirim sistemi
- [ ] Onay akış mekanizması (approval flow)
- [ ] Gelişmiş filtreleme
- [ ] Tarih aralığı seçimi

### Test Edilemeyecek Senaryolar
- Gerçek zamanlı veri akışı (WebSocket)
- Email bildirimleri
- SMS entegrasyonu
- Ödeme gateway entegrasyonu
- Dış API entegrasyonları

---

## 🐛 HATA BULDUĞUNDA

### Hata Raporu Formatı
```
**Sayfa:** [Hangi sayfa]
**Adım:** [Ne yapmaya çalışıyordun]
**Beklenen:** [Ne olması gerekiyordu]
**Gerçekleşen:** [Ne oldu]
**Console Hatası:** [Varsa F12'den kopyala]
**Ekran Görüntüsü:** [Varsa ekle]
```

### Örnek Hata Raporu
```
**Sayfa:** Finansör Detay
**Adım:** Aylık görünümden Ocak ayına tıkladım
**Beklenen:** Günlük görünüm açılmalı ve Ocak ayının günleri görünmeli
**Gerçekleşen:** Sayfa dondu, veri yüklenmedi
**Console Hatası:** TypeError: Cannot read property 'map' of undefined
```

---

## ✅ BAŞARILI TEST KRİTERLERİ

Sistem başarılı kabul edilir eğer:

### Kritik (Mutlaka Çalışmalı) - %100
- [x] Backend ve Frontend çalışıyor
- [x] Login işlemi başarılı
- [x] Finansör listesi görüntüleniyor
- [x] Finansör ekleme çalışıyor
- [x] Finansör detay sayfası YATIRIM ve ÇEKİM kolonlarıyla açılıyor
- [x] Site detay sayfası çalışıyor
- [x] Partner detay sayfası çalışıyor
- [x] Komisyon ayarlama çalışıyor
- [x] Mutabakat sayfası hatasız yükleniyor

### Önemli (Çalışması Beklenir) - %80+
- [ ] Tüm sayfalar arası navigasyon sorunsuz
- [ ] Console'da kritik hata yok
- [ ] Veriler doğru hesaplanıyor
- [ ] Loading state'ler gösteriliyor
- [ ] Modal'lar düzgün açılıp kapanıyor

### İyi Olur (Nice to Have) - %50+
- [ ] Responsive tasarım mobilde iyi görünüyor
- [ ] Animasyonlar akıcı
- [ ] UI tasarım tutarlı
- [ ] Hata mesajları anlaşılır

---

## 📊 TEST SONUÇLARI

### Test Tarihi: _____________
### Test Eden: _____________

#### Özet
- **Toplam Test:** ____ / 50
- **Başarılı:** ____
- **Başarısız:** ____
- **Atlandı:** ____

#### Kritik Hatalar
1. _______________________
2. _______________________
3. _______________________

#### Orta Seviye Hatalar
1. _______________________
2. _______________________

#### Küçük Hatalar / İyileştirmeler
1. _______________________
2. _______________________

#### Genel Değerlendirme
_______________________
_______________________
_______________________

---

## 🎯 SONRAKİ ADIMLAR

### Öncelikli Geliştirmeler
1. **İşlem Oluşturma Sayfası** - Manual transaction entry
2. **Bloke Yönetimi** - Finansör bloke ekleme/çıkarma
3. **Excel Export** - Tüm raporlar için
4. **Gelişmiş Filtreleme** - Tarih, tutar, durum filtreleri
5. **Onay Akışı** - Multi-level approval system

### Teknik İyileştirmeler
1. Error boundary ekleme
2. Loading skeleton components
3. Optimistic UI updates
4. Request caching
5. Performance optimizasyonu

---

## 📞 DESTEK

Sorularınız için:
- Backend API Docs: http://localhost:3001/docs
- Database: PostgreSQL on localhost:5432
- Frontend: Next.js 15 on localhost:3000

**Not:** Bu dokümantasyon test sürecini kolaylaştırmak için hazırlanmıştır. Her test adımını dikkatlice takip edin ve bulduğunuz hataları detaylı şekilde kaydedin.
