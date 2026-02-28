# Phase 6: Borç/Alacak Yönetim Sayfası - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Kullanıcı tek bir sayfada tüm borçları özet, liste, geçmiş ve matrix şeklinde görebilir. Backend API'ler Phase 5'te tamamlandı — bu faz tamamen frontend sayfası oluşturma.

Requirements: PAGE-01 (özet dashboard), PAGE-02 (açık borçlar listesi), PAGE-03 (işlem geçmişi), PAGE-04 (finansör matrix)

</domain>

<decisions>
## Implementation Decisions

### Sayfa Yapısı ve Organizasyon
- Sekmeli (Tabs) yapı: Üst kısımda özet kartları sabit kalacak, altında sekmeler ile Açık Borçlar / İşlem Geçmişi / Finansör Matrix gösterilecek
- Sayfa URL: `/borclar` — Türkçe, kısa ve anlaşılır
- Sidebar'da ana menü öğesi olarak yer alacak (Transactions, Approvals seviyesinde)

### Özet Kartları (PAGE-01)
- 4 kart — Requirements'taki gibi: Toplam Borç, Toplam Alacak, Net Durum, Aktif Borç Sayısı
- API: `GET /api/debts/summary` endpoint'i kullanılacak (total_active_debt, total_paid, active_debt_count mevcut)
- Finansör bazlı alacak toplamı için `GET /api/debts/financier-summary` endpoint'i de kullanılabilir

### Açık Borçlar Listesi (PAGE-02)
- Tablo görünümü — mevcut Table bileşeni ile tutarlı
- Sütunlar: Borç Veren, Borç Alan, Başlangıç Tutarı, Kalan Bakiye, Tarih
- Temel filtreler: Finansör seçimi + Durum filtresi (Aktif/Ödenmiş/İptal)
- Borç ödeme ilerlemesi: Progress bar ile görsel gösterim
- Boş durum: İllustrasyon + mesaj (ikon/görsel + "Borç kaydı bulunmuyor")
- API: `GET /api/debts?status=ACTIVE` endpoint'i (paginated, financier_id filtreli)

### İşlem Geçmişi (PAGE-03)
- Kronolojik tablo: Tüm borç verme ve ödeme kayıtları tarih sırasına göre
- Aynı filtre seti: Finansör seçimi + Durum filtresi
- API: `GET /api/debts` endpoint'i tüm durumlarla

### Finansör Matrix Tablosu (PAGE-04)
- Sıfır değerler: Boş bırak — temiz görünüm
- Renk kodlaması: Isı haritası (heat map) — yüksek tutarlar koyu, düşükler açık
- Çapraz hücreler (kendi kendine): Gri/devre dışı arka plan
- Satır/sütun toplamları: Evet, son satır ve son sütunda toplam borç/alacak gösterilecek
- API: `GET /api/debts/matrix` endpoint'i (financiers + matrix dizisi döner)

### Borç Detay ve Aksiyonlar
- Borç detay: Satır içi genişleme (expandable row) — tıklanan satır açılır, ödeme geçmişi + aksiyonlar görünür
- Ödeme ve iptal: Bu sayfadan yapılabilecek — modal form ile (API: POST /api/debts/:id/payments, PATCH /api/debts/:id/cancel)
- Yeni borç oluşturma: "Yeni Borç" butonu ile modal form — finansör seç, tutar gir, açıklama ekle (API: POST /api/debts)

### Claude's Discretion
- Özet kartlarının ikon ve renk seçimi
- Loading skeleton tasarımı
- Tablo sıralama davranışı
- Expandable row animasyonu ve düzeni
- Modal form layout detayları
- Responsive davranış (mobil)
- Error state handling

</decisions>

<specifics>
## Specific Ideas

- Header stili mevcut rapor sayfalarıyla tutarlı olsun: `from-slate-900 to-slate-800` gradient
- Matrix heat map renkleri deep space blue tema ile uyumlu olsun
- Progress bar rengi ödeme durumuna göre: düşük ödeme kırmızımsı, yüksek ödeme yeşilimsi

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/card.tsx`: Özet kartları için Card + CardContent bileşeni
- `components/ui/table.tsx`: Borç listesi için Table bileşeni
- `components/ui/tabs.tsx`: Sekme yapısı için Tabs bileşeni
- `components/ui/dialog.tsx`: Ödeme/iptal/yeni borç modal formları
- `components/ui/badge.tsx`: Borç durumu etiketi (ACTIVE/PAID/CANCELLED)
- `components/ui/skeleton.tsx`: Loading state
- `components/ui/select.tsx`: Finansör filtresi
- `components/ui/button.tsx`: Aksiyon butonları
- `components/ui/input.tsx` + `textarea.tsx`: Form alanları
- `lib/utils.ts`: `formatMoney()` para formatlama fonksiyonu
- `hooks/use-api.ts`: React Query hook pattern'i (useQuery, useMutation)

### Established Patterns
- Rapor sayfaları: `rounded-xl bg-gradient-to-r from-slate-900 to-slate-800` header stili
- Dashboard: lucide-react ikonları + Card bileşeni ile özet kartlar
- Data fetching: TanStack Query hooks `use-api.ts` dosyasında tanımlı
- Sidebar navigasyon: `components/layout/sidebar.tsx` dosyasında NavItem dizisi

### Integration Points
- Sidebar'a yeni NavItem eklenecek: `/borclar` route'u
- `hooks/use-api.ts` dosyasına debt endpoint'leri için yeni React Query hook'ları eklenecek (useDebtSummary, useDebts, useDebtMatrix, useCreateDebt, usePayDebt, useCancelDebt)
- `app/(dashboard)/borclar/page.tsx` yeni sayfa dosyası oluşturulacak
- Backend debt module hazır: `/api/debts/*` endpoint'leri (summary, financier-summary, matrix, CRUD, payments, cancel)

</code_context>

<deferred>
## Deferred Ideas

- Finansör detay sayfasından borç entegrasyonu — Phase 7 (FDET-01, FDET-02, FDET-03)
- Borç PDF export — Future requirement (REPT-01)
- Borç vade analizi — Future requirement (REPT-02)
- Faiz/komisyon hesaplama — Out of scope (DEBT-05)

</deferred>

---

*Phase: 06-borc-alacak-yonetim-sayfasi*
*Context gathered: 2026-03-01*
