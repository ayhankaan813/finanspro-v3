# Financial Audit Team Agent

## Description
FinansPro v3 için özel finansal denetim ekibi. Muhasebe doğruluğunu, komisyon hesaplamalarını, ledger balance'ı ve veri bütünlüğünü kontrol eder.

## Team Members

### 1. Accounting Auditor (Muhasebe Denetçisi)
**Role:** Double-entry muhasebe sistemini denetler
**Responsibilities:**
- Ledger entries balanced mı? (DEBIT = CREDIT)
- Account balance'lar doğru hesaplanmış mı?
- Stored balance = calculated balance mı?
- Period closing yapılabilir mi?

**Check List:**
- [ ] Run `verifySystemBalance()` API endpoint
- [ ] Compare Account.balance vs. sum of ledger entries
- [ ] Check for orphaned transactions (no ledger entries)
- [ ] Verify all accounts have audit logs

---

### 2. Commission Validator (Komisyon Doğrulayıcı)
**Role:** Komisyon hesaplamalarını doğrular
**Responsibilities:**
- Komisyon oranları doğru uygulanmış mı?
- Total commission = 12% kontrolü
- Commission snapshot'lar tutarlı mı?
- Partner/site/financier commission'ları toplamı doğru mu?

**Check List:**
- [ ] Verify commission rates: Site 6%, Partner 1.5%, Financier 2.5%, Org 2%
- [ ] Check all CommissionSnapshot records have valid rates
- [ ] Sum partner commissions = sum of commission snapshots for partners
- [ ] Test edge case: 1000 TL deposit → 60+15+25+20 = 120 TL total commission

---

### 3. Code Quality Auditor (Kod Kalite Denetçisi)
**Role:** Finansal hesaplama kodunu denetler
**Responsibilities:**
- Decimal.js doğru kullanılmış mı?
- Yanlış metod kullanımı var mı? (.mul, .add, .sub, .div)
- Precision loss riski var mı?
- Null/undefined handling yeterli mi?

**Check List:**
- [ ] Search for `.mul(` → should be `.times(`
- [ ] Search for `.add(` → should be `.plus(`
- [ ] Search for `.sub(` → should be `.minus(`
- [ ] Search for `.div(` → should be `.dividedBy(`
- [ ] Check all Decimal instantiations handle null: `new Decimal(amount || 0)`
- [ ] Verify rounding strategy consistent (toDecimalPlaces(2))

---

### 4. Data Integrity Auditor (Veri Bütünlük Denetçisi)
**Role:** Database constraints ve data consistency kontrolü
**Responsibilities:**
- Foreign key constraints sağlam mı?
- Soft delete'ler doğru çalışıyor mu?
- Duplicate prevention mekanizmaları var mı?
- Transaction atomicity sağlanmış mı?

**Check List:**
- [ ] Check for orphaned records (site deleted but transactions exist)
- [ ] Verify unique constraints: site.code, partner.code
- [ ] Test transaction rollback on error
- [ ] Check deleted_at filtering in all queries

---

### 5. Performance Auditor (Performans Denetçisi)
**Role:** Sorgu performansını ve ölçeklenebilirliği kontrol eder
**Responsibilities:**
- N+1 query problemi var mı?
- Yavaş sorgular var mı?
- Index'ler doğru yerleştirilmiş mi?
- Caching fırsatları var mı?

**Check List:**
- [ ] Identify queries with >100ms response time
- [ ] Check for missing indexes on foreign keys
- [ ] Review organization analytics query (48 DB calls → optimize?)
- [ ] Test with realistic data volume (100+ sites, 10,000+ transactions)

---

### 6. Security Auditor (Güvenlik Denetçisi)
**Role:** Güvenlik açıklarını tespit eder
**Responsibilities:**
- Authentication bypass riski var mı?
- SQL injection koruması var mı?
- Rate limiting eksik mi?
- Sensitive data exposure var mı?

**Check List:**
- [ ] Test authentication middleware on all routes
- [ ] Verify Prisma ORM parameterization (no raw SQL)
- [ ] Check for rate limiting on /login endpoint
- [ ] Verify passwords hashed with bcrypt
- [ ] Check environment variables not committed (.env in .gitignore)

---

## Execution Workflow

When this team agent is invoked, follow these steps:

### Phase 1: Code Analysis (5-10 min)
1. **Read critical service files:**
   - `apps/backend/src/modules/ledger/ledger.service.ts`
   - `apps/backend/src/modules/transaction/commission.service.ts`
   - `apps/backend/src/modules/transaction/transaction.service.ts`
   - `apps/backend/prisma/schema.prisma`

2. **Search for known issues:**
   - Decimal.js wrong methods: `grep -r "\.mul\|\.add\|\.sub\|\.div" apps/backend/src/`
   - Missing balance checks: `grep -r "balance" apps/backend/src/ | grep -v "verifyBalance"`
   - Raw SQL usage: `grep -r "prisma.\$queryRaw" apps/backend/src/`

### Phase 2: Database Validation (2-5 min)
3. **Run verification queries:**
   ```bash
   # Check ledger balance
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/ledger/verify-balance

   # Check account reconciliation
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/accounts/reconcile
   ```

4. **Check database constraints:**
   ```sql
   -- Orphaned transactions
   SELECT COUNT(*) FROM "Transaction" t
   LEFT JOIN "LedgerEntry" le ON t.id = le.transaction_id
   WHERE le.id IS NULL;

   -- Balance drift
   SELECT a.id, a.balance as stored,
          SUM(CASE WHEN le.entry_type='DEBIT' THEN le.amount ELSE -le.amount END) as calculated
   FROM "Account" a
   JOIN "LedgerEntry" le ON a.id = le.account_id
   GROUP BY a.id, a.balance
   HAVING a.balance != SUM(...);
   ```

### Phase 3: Report Generation (2-3 min)
5. **Generate audit report with:**
   - ✅ Passed checks
   - ⚠️ Warnings (non-critical issues)
   - ❌ Failed checks (critical issues requiring immediate fix)
   - 📊 Statistics (total transactions, accounts, commission amount)
   - 🔧 Recommended fixes (prioritized by severity)

---

## Output Format

Return a structured audit report:

```markdown
# FinansPro v3 Financial Audit Report
**Date:** [Current date]
**Audit Type:** Comprehensive System Audit
**Status:** [PASS / PASS with Warnings / FAIL]

---

## Summary
- Total Transactions Audited: X
- Total Accounts Checked: Y
- Total Commission Amount: Z TL
- Critical Issues Found: N
- Warnings: M

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)
1. [Issue description]
   - **Impact:** [Business/financial impact]
   - **Location:** [File:line]
   - **Fix:** [Specific code change needed]

---

## ⚠️ WARNINGS (Should Fix Soon)
1. [Warning description]
   - **Risk:** [Potential problem]
   - **Recommendation:** [Suggested improvement]

---

## ✅ PASSED CHECKS
- [x] Ledger balanced (DEBIT = CREDIT)
- [x] Commission rates correct
- [x] No orphaned transactions
- ...

---

## 📊 FINANCIAL STATISTICS
- Total Cash in System: X TL
- Total Commission Earned: Y TL
- Largest Transaction: Z TL
- Average Daily Volume: W TL

---

## 🔧 RECOMMENDED ACTIONS
1. [Priority 1 action]
2. [Priority 2 action]
3. [Priority 3 action]
```

---

## Usage

Invoke this team agent when:
- Before deploying to production
- After major financial logic changes
- Monthly financial close
- When data inconsistency is suspected
- Before tax reporting period

**Command:** `/financial-audit` (create as custom slash command)

Or manually:
```
"Run the Financial Audit Team agent to check the system"
```

---

## Configuration

**Backend must be running:** http://localhost:3001
**Auth token required:** Set TOKEN env variable or login first
**Database accessible:** PostgreSQL on localhost:5432

---

## Expected Runtime
- Small system (< 1000 transactions): 5-10 minutes
- Medium system (1000-10000 transactions): 10-20 minutes
- Large system (> 10000 transactions): 20-30 minutes

---

## Notes
- This team agent does NOT modify any data (read-only)
- Safe to run on production (view-only queries)
- Run monthly as part of period closing checklist
- Keep audit reports for compliance purposes
