# Codebase Concerns

**Analysis Date:** 2026-02-28

## Tech Debt

**Transaction Service Size & Complexity:**
- Issue: `transaction.service.ts` is 2,758 lines - largest service by far, handling 18 transaction types in a single class
- Files: `apps/backend/src/modules/transaction/transaction.service.ts`
- Impact: Difficult to maintain, test, and debug. High cognitive load when modifying transaction logic. Single file change risks breaking multiple transaction types
- Fix approach: Refactor into separate handler classes per transaction type (DepositHandler, WithdrawalHandler, PaymentHandler, etc.) using strategy pattern. Move to `transaction-handlers/` subdirectory

**Type Safety With "as unknown as" Casts:**
- Issue: 13+ instances of unsafe type casting `as unknown as Prisma.JsonObject` to force Decimal.js values into JSON fields
- Files: `apps/backend/src/modules/transaction/transaction.service.ts` (lines 208, 359, 659, 1721, 2477) and similar patterns
- Impact: Bypasses TypeScript safety. No compiler verification that JSON serialization succeeds. Could silently fail in production
- Fix approach: Create proper Prisma composite type for `metadata` field using `Json` + validation schema. Use JSON.parse/stringify with explicit handling

**Type Coercion With "any" Types:**
- Issue: 6+ instances of `any` type in transaction service (lines 1823, 2544, 2545, 2546, 2695, 2631)
- Files: `apps/backend/src/modules/transaction/transaction.service.ts`
- Impact: Loses TypeScript protection in critical business logic. Bulk import uses `any[]` parameter, no schema validation
- Fix approach: Create explicit `BulkImportInput` Zod schema with proper validation. Replace all remaining `any` with proper types

**Unimplemented Endpoints (TODO Comments):**
- Issue: Settings routes have placeholder implementations returning empty arrays
- Files: `apps/backend/src/modules/settings/settings.routes.ts` (lines 82, 92)
- Impact: Frontend expects `/settings/categories` and `/settings/delivery-types` endpoints but backend returns `{ items: [], total: 0 }`. Features dependent on these will fail silently
- Fix approach: Implement `DeliveryTypeService` and `CategoryService` with full CRUD. Create database migrations for these tables if missing

---

## Known Bugs

**Delivery Type ID Validation Mismatch:**
- Symptoms: DELIVERY transaction creation may fail with validation error "Geçersiz UUID"
- Files: `apps/backend/src/modules/transaction/transaction.schema.ts` (line 44)
- Trigger: Creating DELIVERY transaction via API with delivery_type_id as string
- Root cause: Schema defines `delivery_type_id: z.string().min(1).optional()` (allows any string) but seed data may use non-UUID strings from database
- Workaround: Ensure delivery_type_id in form submission is valid UUID, or remove UUID validation
- Fix approach: Clarify if delivery_type_id should be UUID or string. Update schema and database consistently

**Bulk Import Date Parsing Too Strict:**
- Symptoms: Bulk import fails on date format mismatch
- Files: `apps/backend/src/modules/transaction/transaction.service.ts` (line 2664)
- Root cause: Hardcoded `DD.MM.YYYY` format split - fails if dates use different separator or format
- Impact: 1 malformed date aborts entire bulk import batch
- Fix approach: Add date format detection or parameter. Improve error messages to show exact column/row that failed

**Organization Account Balance Negation Confusion:**
- Symptoms: Org balance display may seem inverted in ledger context
- Files: `apps/backend/src/modules/organization/organization.service.ts` (lines 27-49)
- Root cause: Organization stored as ASSET account but ledger entries recorded as CREDIT (income) and DEBIT (expense). Service negates display balance
- Impact: Easy to misinterpret. If ledger DEBIT/CREDIT logic changes, balance calculation inverts unexpectedly
- Fix approach: Document why negation exists. Consider storing org balance as LIABILITY in schema for intuitive math, or create unit tests that verify expected values

---

## Security Considerations

**JWT Secret in Environment Variables:**
- Risk: JWT_SECRET passed via env vars, could be exposed in logs/error messages
- Files: `apps/backend/src/config/` (environment loading), `apps/backend/src/app.ts` (line 56)
- Current mitigation: Secrets not logged, but vulnerable to environment variable leaks
- Recommendations:
  1. Use HashiCorp Vault or AWS Secrets Manager in production
  2. Add secret rotation mechanism
  3. Implement audit logging for token creation/verification failures

**CORS Configured to Accept All in Development:**
- Risk: `cors: { origin: isDev ? true : ... }` accepts any origin in dev, easy to forget to change for production
- Files: `apps/backend/src/app.ts` (line 43)
- Current mitigation: Conditional based on isDev, but relies on ENV variable correctness
- Recommendations:
  1. Add explicit whitelist in dev (localhost only)
  2. Validate CORS_ORIGIN is never `*` in production
  3. Add startup warning if CORS too permissive

**Rate Limiting Too Permissive:**
- Risk: Global rate limit is 100 requests/minute (1.67 req/sec). Auth endpoint has 5 attempts/minute
- Files: `apps/backend/src/app.ts` (line 50)
- Current mitigation: Auth endpoint has separate tighter limit
- Impact: Bulk import, analytics queries could hit limit legitimately
- Recommendations: Increase global limit or tier by endpoint. Monitor rate limit hits

**No HTTPS Enforcement:**
- Risk: Application doesn't enforce HTTPS in production (no redirects, no HSTS headers)
- Files: `apps/backend/src/app.ts`
- Current mitigation: Helmet enabled for CSP
- Recommendations:
  1. Add HSTS header (min-age 31536000)
  2. Enforce HTTPS redirect in production
  3. Document reverse proxy requirement

**Decimal.js Values Exposed in API Responses:**
- Risk: JSON responses may expose Decimal.js object structure instead of string values
- Files: `apps/backend/src/modules/transaction/transaction.service.ts` (commission snapshots), `apps/frontend/src/hooks/use-api.ts` (Transaction type expects strings)
- Current mitigation: Frontend type definitions expect `string` for balance/amount fields
- Impact: If service returns Decimal object directly instead of `.toString()`, frontend parsing fails
- Recommendations:
  1. Add response serialization middleware that converts all Decimal → string
  2. Add type guard at API boundary
  3. Document that all numeric responses must be strings

---

## Performance Bottlenecks

**Organization Stats Query (N+1 Problem):**
- Problem: Gets monthly stats with 4 parallel aggregates + category lookups, but method loops 12x per year
- Files: `apps/backend/src/modules/organization/organization.service.ts` (lines 323-370)
- Cause: `getMonthlyTrend()` method called for each month, each runs findMany queries
- Symptoms: Fetching 1-year trend ~48 queries (4 per month × 12). Should be 1 query
- Impact: Analytics dashboard slow on first load. ~500-800ms query time for annual report
- Improvement path:
  1. Refactor to single query with groupBy by month
  2. Use window functions in raw SQL if Prisma can't express it
  3. Cache computed monthly stats (1-hour TTL)
  4. Add index on transaction(transaction_date, type, status)

**Ledger Balance Recalculation:**
- Problem: When reversing transactions, service queries all ledger entries and recalculates balance_after sequentially
- Files: `apps/backend/src/modules/ledger/ledger.service.ts` (lines 75-150)
- Cause: No efficient way to recalculate downstream balances after reversal in middle of ledger
- Impact: Reversing old transaction (month 3 of 12) requires updating balance_after for entries in months 4-12. Linear scan
- Improvement path:
  1. Consider storing only entry balance (not balance_after) and compute on read
  2. Or add database trigger to auto-update balance_after
  3. Or cache balance at month boundaries and recalculate from there

**Bulk Import Sequential Processing:**
- Problem: Bulk import processes transactions one-by-one for safety, takes ~100-200ms per transaction
- Files: `apps/backend/src/modules/transaction/transaction.service.ts` (lines 2640-2700)
- Cause: Fear of ledger consistency issues with parallel processing
- Impact: Importing 100 transactions takes ~10-20 seconds
- Improvement path:
  1. Batch inserts in groups of 10, validate ledger balance per batch
  2. Use Prisma's `createMany()` for initial creation phase
  3. Add progress webhook/subscription for long-running imports
  4. Set 30-second timeout expectation for batches

**Frontend Cache Staleness:**
- Problem: Inconsistent staleTime across 20+ hooks (30s, 60s, 120s, 5min). Financial data becomes stale
- Files: `apps/frontend/src/hooks/use-api.ts` (scattered staleTime values)
- Cause: Each hook chose arbitrary staleTime, no coordination
- Impact: User sees balance from 5 minutes ago while viewing other 30s-fresh data. Confusing
- Improvement path:
  1. Create cache config constants (CACHE_FINANCIAL_5MIN, CACHE_STATS_1MIN, etc.)
  2. Standardize by data type, not per endpoint
  3. Add real-time subscription for critical balance updates
  4. Implement optimistic UI updates for mutations

---

## Fragile Areas

**Commission Calculation Logic:**
- Files: `apps/backend/src/modules/transaction/commission.service.ts` (all)
- Why fragile: Critical business logic with 12 commission distribution rules. Rounding at multiple levels (toDecimalPlaces(2)). Organization "absorbs rounding" means balance can shift by ±0.01 TL per transaction
- Symptoms if broken: Unbalanced ledgers (DEBIT ≠ CREDIT), commission not adding to site commission pool, organization balance off
- Safe modification:
  1. Add property-based tests with arbitrary commission rates
  2. Always verify: site_commission = partner_total + financier + org in new transactions
  3. Never modify commission calculation without running full ledger audit
  4. Write integration test for each transaction type before change
- Test coverage: `commission.service.ts` has tests but edge cases (rounding, missing rates) may not be covered

**Double-Entry Ledger:**
- Files: `apps/backend/src/modules/ledger/ledger.service.ts` (all), `apps/backend/src/modules/transaction/transaction.service.ts` (ledger entry creation)
- Why fragile: CRITICAL: Any transaction creating DEBIT ≠ CREDIT silently breaks audits. Takes days to trace back
- Symptoms if broken: Reconciliation report shows "unexplained variance". Balance doesn't add up across sites
- Safe modification:
  1. Add ledger imbalance check in every transaction path
  2. Never skip balance validation (even in migrations)
  3. Write test that applies transaction, reverses it, verifies ledger returns to start state
  4. Use `LedgerImbalanceError` not generic error
- Test coverage: Good error thrown, but not all transaction paths tested

**Transaction Approval Workflow:**
- Files: `apps/backend/src/modules/approval/approval.service.ts` (all), transaction routes
- Why fragile: PENDING transactions create ledger entries only after approval. If approval is rejected, ledger must be reversed
- Symptoms if broken: Rejected transaction ledger entries remain, balance wrong, audit trail broken
- Safe modification:
  1. Never create ledger until transaction status = COMPLETED
  2. Test: create PENDING → reject → verify ledger is empty
  3. Test: PENDING → approve → verify ledger created
  4. Document which transaction types require approval
- Test coverage: Approval service has tests but transaction service ledger creation timing not fully covered

**Site/Partner Running Balance Calculation:**
- Files: `apps/backend/src/modules/site/site.service.ts` (lines 480-520), `apps/backend/src/modules/partner/partner.service.ts` (similar)
- Why fragile: Uses BACKWARD calculation (current → previous). Easy to reverse direction accidentally
- Symptoms if broken: Monthly balances progressively wrong, especially for mid-year months
- Safe modification:
  1. Add comment above every balance calculation: "BACKWARD: current - change = previous"
  2. Write test with 3+ months of transactions, verify each month's previous balance
  3. Test with deposits AND withdrawals
- Test coverage: Exists but backward-specific tests may be minimal

**File Upload/Bulk Import Error Handling:**
- Files: `apps/backend/src/modules/transaction/transaction.service.ts` (processBulkImport, lines 2631-2702)
- Why fragile: Error on row 50 of 100 aborts import, but rows 1-49 committed. User has inconsistent state
- Symptoms if broken: Partial imports, unclear which rows succeeded, restart causes duplicates
- Safe modification:
  1. Add transaction-level rollback (commit all or none)
  2. Or implement idempotency key (transaction_id, not created_at)
  3. Add detailed error response with per-row status
- Test coverage: No rollback test. Need to test failure at row 99, verify all rolled back

---

## Scaling Limits

**Database Connection Pool:**
- Current capacity: Prisma default pool = 2 (single connection), implicit 10 max
- Limit: Hits when >10 concurrent requests with transactions
- Scaling path:
  1. Increase `connection_limit` in DATABASE_URL (current: not set, defaults to 10)
  2. Monitor with: `SELECT count(*) FROM pg_stat_activity`
  3. At 100 concurrent users, move to connection pooler (PgBouncer) or RDS Proxy

**Ledger Table Growth:**
- Current capacity: Each transaction creates 4-8 ledger entries. 1000 txns/day = 4000-8000 entries/day
- Limit: At 1M entries (~125 days), queries start slowing (missing indexes)
- Scaling path:
  1. Add composite index: `CREATE INDEX idx_ledger_date_type ON ledger_entry(created_at, entry_type)`
  2. Archive old entries (>1 year) to separate table
  3. Consider materialized views for annual reports

**API Response Size:**
- Current capacity: Organization annual stats returns ~12 months × 4 metrics = ~48 fields. Gzipped ~2KB
- Limit: If data expands to 5 years, response ~10KB. Slow on mobile
- Scaling path:
  1. Pagination for monthly trends
  2. Summary endpoint (annual only) separate from details
  3. Client-side caching more aggressively

**Frontend React Query Cache:**
- Current capacity: Default gcTime=10min. ~50 queries active = ~50MB in memory
- Limit: Extends to 100+ users on same browser session
- Scaling path:
  1. Implement persistent cache (localStorage)
  2. Reduce gcTime to 5 minutes
  3. Add manual cache eviction on logout

---

## Dependencies at Risk

**Decimal.js (No Alternatives in Use):**
- Risk: Single library for all financial math. If it has bug with edge case decimals, affects entire system
- Impact: Commission mismatch, ledger imbalance, audit failure
- Migration plan:
  1. No direct replacement in JS ecosystem
  2. Consider BigInt for integers-only (commission as cents, not TL)
  3. Or TypeScript Decimal type from library ecosystem
  4. Mitigation: Add decimal.js audits before major upgrades

**Prisma Dependency on PostgreSQL:**
- Risk: Tightly coupled to PostgreSQL. Custom SQL functions for window operations might not port
- Impact: Switching databases very difficult
- Migration plan:
  1. Abstract DB-specific queries into service layer
  2. Document which queries use PostgreSQL-specific features
  3. Consider Query Builder (Knex) for flexibility

**Fastify Security Plugins (helmet, cors, rate-limit):**
- Risk: Each plugin has own maintenance cycle. Security hole in one blocks major upgrade
- Impact: If helmet has CVE, might need to pause other upgrades
- Migration plan:
  1. Audit plugins quarterly
  2. Have backup implementations (native Node middleware)
  3. Monitor fastify-ecosystem security advisories

---

## Missing Critical Features

**No Audit Trail for Sensitive Operations:**
- Problem: Commission changes, transaction reversals not logged with reason/approver
- Blocks: Regulatory compliance, dispute resolution, forensics
- Fix: Implement AuditLog entries for all mutations with `old_data`, `new_data`, `changed_by`, `reason`

**No Financial Reconciliation Tool:**
- Problem: No systematic way to verify ledger matches external bank statements
- Blocks: Month-end close, regulatory reporting
- Fix: Add reconciliation module with bank statement import, unmatched transaction detection

**No Multi-Organization Support:**
- Problem: Code assumes single organization (hardcoded `org-main-account` ID)
- Blocks: Scaling to multi-tenant
- Fix: Add organization_id to all core tables, refactor org-specific queries

**No Transaction Reversal Reason Tracking:**
- Problem: Reversed transactions record `reversal_reason` but no linked approval/ticket
- Blocks: Audit trail, preventing duplicate reversals
- Fix: Add `reversal_ticket_id` foreign key, require linked approval

**No Scheduled/Recurring Transactions:**
- Problem: Only manual transactions supported
- Blocks: Monthly payroll, recurring commission payouts
- Fix: Add Schedule model with cron-like rules, background job processor

---

## Test Coverage Gaps

**Transaction Service Edge Cases:**
- What's not tested: Decimal rounding across different commission structures, negative amounts, zero amounts, very large amounts (>Decimal.MAX_VALUE)
- Files: `apps/backend/src/modules/transaction/transaction.service.ts`
- Risk: User enters 999,999,999 TL deposit, calculation overflows or truncates
- Priority: **HIGH** - Financial precision critical

**Approval Workflow State Transitions:**
- What's not tested: PENDING→APPROVED→COMPLETED flow for all 18 transaction types. What happens if approved twice? Rejected after approved?
- Files: `apps/backend/src/modules/approval/approval.service.ts`, transaction routes
- Risk: Double-processing, ledger entry duplication, missing audit trail
- Priority: **HIGH** - Business process integrity

**Ledger Consistency After Bulk Operations:**
- What's not tested: Bulk import of 1000 transactions, all created, then verify total DEBIT = CREDIT. Bulk reversal of transactions
- Files: `apps/backend/src/modules/transaction/transaction.service.ts` (processBulkImport)
- Risk: Silent ledger imbalance after bulk operations
- Priority: **HIGH** - Critical business invariant

**Database Connection Failure Handling:**
- What's not tested: Prisma connection drops mid-transaction, retry behavior, partial state recovery
- Files: `apps/backend/src/shared/prisma/`
- Risk: Orphaned half-committed transactions
- Priority: **MEDIUM** - Operational resilience

**Frontend API Error Recovery:**
- What's not tested: 5xx error on transaction POST, what happens to optimistic update? Cache invalidation after error?
- Files: `apps/frontend/src/hooks/use-api.ts`
- Risk: UI state inconsistent with server, double-posting
- Priority: **MEDIUM** - User experience

**Commission Rate Effective Date Handling:**
- What's not tested: Transaction uses rate from `effective_from` date, what if rate changed mid-day?
- Files: `apps/backend/src/modules/settings/commission-rate.service.ts`
- Risk: Different commission applied retroactively or wrong rate for old transactions
- Priority: **MEDIUM** - Business rule enforcement

---

## Code Quality Concerns

**Error Message Inconsistency:**
- Issue: Some errors Turkish ("Geçersiz"), some English ("Invalid"), some generic
- Files: Transaction schema, auth routes, all validation
- Impact: Confusing to non-Turkish speakers, inconsistent API contracts
- Fix: Standardize error codes (INVALID_AMOUNT, INSUFFICIENT_BALANCE) + translations in middleware

**Metadata Field Overloaded:**
- Issue: Uses `metadata` JSON field for multiple unrelated purposes (commission calculation context, delivery details, edit history)
- Files: `apps/backend/src/modules/transaction/` (various)
- Impact: Unclear schema, hard to query specific metadata, rounding errors in field updates
- Fix: Create explicit `CommissionMetadata`, `DeliveryMetadata`, `EditHistory` models instead of free-form JSON

**No Health Check Endpoint:**
- Issue: No way to verify API health from monitoring/load balancer
- Files: Missing from `apps/backend/src/app.ts`
- Impact: Downtime undetected, traffic routed to dead instances
- Fix: Add `/health` endpoint that checks DB connection + ledger balance sanity

---

*Concerns audit: 2026-02-28*
