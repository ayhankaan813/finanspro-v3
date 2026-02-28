# Phase 5: Data Foundation and API - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Finansörler arası borç verme/alma kaydı oluşturma, kısmi/tam ödeme kaydetme, ve borç iptali — backend tarafı tamamen hazır hale gelecek. Ledger entegrasyonu YOK (borç/alacak ayrı tablo). Frontend bu fazda kapsam dışı (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Veri modeli
- Status enum: `ACTIVE`, `PAID`, `CANCELLED` — 3 basit durum
- Kısmi ödeme yapılmış borç ACTIVE kalır, remaining_amount alanından takip edilir
- `remaining_amount` hesaplanmış alan olarak Debt tablosunda tutulur — her ödemede güncellenir (mevcut Account.balance ile tutarlı yaklaşım)
- Para birimi: Sadece TL — currency alanı eklenmez, mevcut sistemle tutarlı
- Vade tarihi (due_date) yok — requirements'ta "serbest geri ödeme" modeli belirtilmiş
- Financier ilişkisi: `lender_id` (borç veren) ve `borrower_id` (borç alan) olarak iki FK
- Decimal(15,2) precision — mevcut financial tablolarla aynı

### İptal kuralları
- Sadece ödemesi olmayan borçlar iptal edilebilir (kısmi/tam ödeme varsa iptal engellenir)
- İptal edilen borç listede görünür ama toplam hesaplamalara dahil edilmez (soft state, silinmez)
- Bir finansör kendine borç veremez (lender_id ≠ borrower_id validation)
- Aynı iki finansör arası birden fazla açık borç olabilir — her borç bağımsız takip edilir

### Claude's Discretion
- İptal nedeni (cancellation_reason) zorunlu mu opsiyonel mi
- API endpoint'lerin exact path yapısı ve query parameter tasarımı
- Seed data'daki borç/ödeme senaryolarının sayısı ve çeşitliliği
- DebtPayment tablosunda description zorunlu mu opsiyonel mi
- Ödeme tutarı validation'ı (remaining_amount'tan fazla ödeme engeli)

</decisions>

<specifics>
## Specific Ideas

- Requirements'tan: "serbest geri ödeme" modeli — taksit/vade yok, isteyen istediği zaman öder
- Out of scope (REQUIREMENTS.md): faiz/komisyon, onay mekanizması, ledger entegrasyonu, taksit planı
- Mevcut muhasebe sistemi (ledger) ile entegrasyon yok — borç/alacak tamamen ayrı tablo

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FinancierService` (`financier.service.ts`): findById, findAll, getAvailableBalance — borç oluştururken financier validasyonu için kullanılabilir
- `Decimal.js` config (`shared/utils/decimal.ts`): precision 20, ROUND_HALF_UP — tüm tutarlar için kullanılacak
- Error classes (`shared/utils/errors.ts`): NotFoundError, BusinessError, ConflictError — borç/ödeme hataları için hazır
- `AuditLog` modeli: Tüm create/update/delete işlemleri için audit trail mevcut

### Established Patterns
- Module yapısı: `routes.ts` → `controller.ts` → `service.ts` → `schema.ts` → `index.ts`
- Prisma `$transaction()` ile atomik işlemler (financier block oluşturma örneği mevcut)
- Zod schema ile input validation, hata Fastify error handler'da yakalanır
- API response format: `{ success: true, data: {...} }` / `{ success: false, error: {...} }`
- Singleton service export: `export const debtService = new DebtService()`

### Integration Points
- `apps/backend/src/app.ts`: Yeni debt module route'ları burada register edilecek
- `apps/backend/prisma/schema.prisma`: Debt ve DebtPayment modelleri eklenecek
- `apps/backend/prisma/seed.ts`: Test borç/ödeme verileri eklenecek
- Financier modeli: `lender` ve `borrower` relation'ları Financier tablosuna bağlanacak

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-data-foundation-and-api*
*Context gathered: 2026-02-28*
