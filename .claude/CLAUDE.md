# FinansPro v3 - Financial Management SaaS Platform

> Modern, güvenli ve ölçeklenebilir finansal yönetim platformu

## 🎯 Proje Vizyonu

FinansPro v3, site, partner, financier ve organization arasındaki finansal akışları yöneten, double-entry muhasebe sistemi ile desteklenen bir SaaS platformudur.

**CEO-CFO Modeli:** Sen CEO (Emre), ben CFO (Claude). Sen stratejik kararlar alırsın, ben finansal doğruluk ve kod kalitesinden sorumluyum.

---

## 📁 Proje Yapısı

```
finanspro-v3/
├── apps/
│   ├── backend/          # Fastify + Prisma + PostgreSQL
│   │   ├── src/
│   │   │   ├── modules/  # Business logic (site, partner, org, transaction, etc.)
│   │   │   ├── shared/   # Utilities (prisma, logger, errors, decimal)
│   │   │   └── config/   # Environment configuration
│   │   └── prisma/       # Database schema & seeds
│   │
│   └── frontend/         # Next.js 15 + React Query + Tailwind
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/ # UI components
│       │   ├── hooks/    # React Query hooks (use-api.ts)
│       │   ├── lib/      # API client, utils
│       │   └── stores/   # Zustand stores (auth)
│       └── public/       # Static assets
│
├── packages/
│   └── shared/           # Shared types and constants
│
└── .claude/              # Claude Code customizations
    ├── commands/         # Custom slash commands
    ├── skills/           # Domain knowledge
    └── CLAUDE.md         # This file
```

---

## 🏗️ Technology Stack

### Backend
- **Framework:** Fastify 5
- **ORM:** Prisma 6
- **Database:** PostgreSQL 17
- **Runtime:** Node.js 18+ with tsx
- **Validation:** Zod schemas
- **Financial:** Decimal.js (for precision)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **State:** React Query + Zustand
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **UI Components:** Radix UI + shadcn/ui

### DevOps
- **Monorepo:** pnpm workspaces + Turbo
- **Package Manager:** pnpm
- **Version Control:** Git + GitHub
- **Development:** tsx watch mode

---

## 💼 Business Logic - Critical Rules

### 1. Commission Structure (FIXED - NEVER CHANGE)
```typescript
const COMMISSION_RATES = {
  SITE: 0.06,          // 6%
  PARTNER: 0.015,      // 1.5%
  FINANCIER: 0.025,    // 2.5%
  ORGANIZATION: 0.02,  // 2%
  TOTAL: 0.12          // 12%
};
```

**Example:** 1000 TL transaction
- Site: 60 TL
- Partner: 15 TL
- Financier: 25 TL
- Organization: 20 TL
- **Total: 120 TL (12%)**

### 2. Double-Entry Accounting

**Golden Rule:** Every transaction creates balanced ledger entries
```
TOTAL DEBIT = TOTAL CREDIT (always)
```

**Account Balance Calculation:**
```typescript
balance = SUM(DEBIT entries) - SUM(CREDIT entries)
```

### 3. Decimal.js - Financial Precision

**ALWAYS use these methods:**
```typescript
✅ .plus()        // Addition
✅ .minus()       // Subtraction
✅ .times()       // Multiplication
✅ .dividedBy()   // Division
✅ .toNumber()    // Convert to number (only for output)

❌ .add()         // WRONG - Don't use
❌ .sub()         // WRONG - Don't use
❌ .mul()         // WRONG - Don't use
❌ .div()         // WRONG - Don't use
```

### 4. Running Balance Calculation

Site/Partner monthly statistics use **BACKWARD calculation**:

```typescript
// Start from current month balance
let runningBalance = currentMonthBalance;

// Calculate month change
const monthChange = deposits
  .plus(topups)
  .minus(withdrawals)
  .minus(payments)
  .minus(commissions);

// Previous month = current - change
const previousMonthBalance = runningBalance.minus(monthChange);
```

**Direction:** Current → Previous (backwards in time)

---

## 🎨 Design System

### Color Palette - Deep Space Blue Theme

```css
--deep-space-blue: #012a4a;    /* Dark base */
--yale-blue: #013a63;          /* Primary */
--yale-blue-2: #01497c;        /* Primary hover */
--rich-cerulean: #2a6f97;      /* Secondary */
--cerulean: #2c7da0;           /* Accent */
--air-force-blue: #468faf;     /* Light accent */
--steel-blue: #61a5c2;         /* Muted */
--sky-blue-light: #89c2d9;     /* Subtle */
--light-blue: #a9d6e5;         /* Background */
```

### Design Principles (2026 Modern UI)

1. **Card-based layouts** with `rounded-3xl` corners
2. **Generous whitespace** for clarity
3. **Subtle shadows** (`shadow-lg`, `shadow-xl`)
4. **Gradient backgrounds** for depth
5. **Smooth transitions** (300ms ease)
6. **Icon + Text** combinations
7. **Responsive grid** layouts
8. **Data visualization** with charts

### Typography
- **Headers:** Bold, Yale Blue (#013a63)
- **Body:** Regular, Slate Gray
- **Numbers:** Monospace for financial data
- **Turkish labels** in UI, English in code

---

## 🔑 Critical Files - Know These Well

### Backend Services

| File | Lines | Responsibility | Critical Points |
|------|-------|----------------|-----------------|
| [site.service.ts](apps/backend/src/modules/site/site.service.ts) | 480-520, 600-640 | Site statistics, running balance | Decimal.js methods, backward calculation |
| [commission.service.ts](apps/backend/src/modules/transaction/commission.service.ts) | All | Commission distribution, snapshots | 12% total check, ledger creation |
| [organization.service.ts](apps/backend/src/modules/organization/organization.service.ts) | 274-336 | Org analytics, monthly trends | Aggregation queries, Decimal handling |
| [partner.service.ts](apps/backend/src/modules/partner/partner.service.ts) | All | Partner management, balance | Similar to site service |
| [ledger.service.ts](apps/backend/src/modules/ledger/ledger.service.ts) | All | Ledger entries, balance calc | DEBIT/CREDIT balance |

### Frontend Hooks & Pages

| File | Responsibility | Critical Points |
|------|----------------|-----------------|
| [use-api.ts](apps/frontend/src/hooks/use-api.ts) | React Query hooks, interfaces | Type safety, cache config |
| [organization/page.tsx](apps/frontend/src/app/(dashboard)/organization/page.tsx) | Org analytics UI | Charts, responsive layout |
| [sites/[id]/page.tsx](apps/frontend/src/app/(dashboard)/sites/[id]/page.tsx) | Site detail & stats | Monthly stats display |

### Database Schema

| File | Responsibility |
|------|----------------|
| [schema.prisma](apps/backend/prisma/schema.prisma) | Database models, relations, indexes |
| [seed.ts](apps/backend/prisma/seed.ts) | Test data generation |

---

## 🚀 Development Workflow

### 1. Starting Development

```bash
# Install dependencies (first time)
pnpm install

# Start PostgreSQL (Docker or local)
# Ensure: localhost:5432

# Database setup
cd apps/backend
npx prisma db push
node --import tsx prisma/seed.ts

# Terminal 1: Backend
cd apps/backend
npm run dev
# Running on: http://localhost:3001

# Terminal 2: Frontend
cd apps/frontend
npm run dev
# Running on: http://localhost:3000
```

### 2. Making Changes - Use Plan Mode First

For complex features:
```
1. Type your goal: "Add monthly profit margin analytics"
2. I analyze in Plan Mode (no code yet)
3. You approve the plan
4. I implement step-by-step
5. Test with /financial-test
6. Verify with /audit
```

### 3. Before Every Commit

```bash
# Run these checks:
/audit              # Financial accuracy check
/deploy-check       # Production readiness
git status          # Review changes
git add .
git commit -m "feat: descriptive message"
git push
```

### 4. Custom Commands Available

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/audit` | Check Decimal.js, ledger balance, commissions | After backend changes |
| `/financial-test` | Full E2E test with seed data | After major features |
| `/deploy-check` | Production checklist | Before deployment |
| `/optimize` | Performance analysis | When things feel slow |

---

## 🧪 Testing Strategy

### Test Database (Development)
```
Host: localhost:5432
Database: finanspro_v3
User: finanspro_v3
Password: finanspro_v3_secure_password
```

### Expected Values After Seed

| Entity | Expected Value |
|--------|---------------|
| Organization balance | 22.00 TL |
| Test site | NISAN |
| Test partner | Ahmet Yılmaz |
| Ledger balance | DEBIT = CREDIT |
| Commission snapshots | 2 records |

### Manual Test Flow

1. Reset database: `npx prisma db push --force-reset`
2. Load seed: `node --import tsx prisma/seed.ts`
3. Start services
4. Login: admin / admin123
5. Verify dashboard: Org balance = 22.00 TL
6. Check NISAN site: Ocak balance = 0.00 TL

### API Testing

```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Test organization balance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/organization/balance

# Test site statistics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/sites/{SITE_ID}/statistics?year=2025"
```

---

## ⚠️ Common Pitfalls & Solutions

### Issue 1: NaN Values in Balance
**Cause:** Using wrong Decimal methods or null values
**Solution:**
```typescript
// ❌ Wrong
const total = amount.add(value);  // No .add() method!

// ✅ Correct
const total = new Decimal(amount || 0).plus(value || 0);
```

### Issue 2: Frontend Shows Old Data
**Cause:** React Query cache
**Solution:**
```
1. Hard refresh: Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)
2. Or update staleTime in use-api.ts
3. Or invalidate query: queryClient.invalidateQueries(['org-balance'])
```

### Issue 3: Ledger Unbalanced
**Cause:** Missing DEBIT or CREDIT entry
**Solution:**
```typescript
// Always create pairs
await createLedger({ type: DEBIT, amount: X });
await createLedger({ type: CREDIT, amount: X });

// Verify total
SELECT SUM(CASE WHEN entry_type='DEBIT' THEN amount ELSE 0 END) as debit,
       SUM(CASE WHEN entry_type='CREDIT' THEN amount ELSE 0 END) as credit
FROM ledger_entry;
```

### Issue 4: Site Statistics Wrong Month Balance
**Cause:** Running balance direction wrong
**Solution:**
```typescript
// ❌ Wrong (forward)
runningBalance = runningBalance.plus(monthChange);

// ✅ Correct (backward)
runningBalance = runningBalance.minus(monthChange);
```

---

## 📚 Code Style Guide

### TypeScript

```typescript
// ✅ Good
async function calculateCommission(amount: Decimal): Promise<CommissionBreakdown> {
  const siteCommission = amount.times(COMMISSION_RATES.SITE);
  const partnerCommission = amount.times(COMMISSION_RATES.PARTNER);
  // ...
  return { site: siteCommission, partner: partnerCommission, ... };
}

// ❌ Bad
function calc(amt) {  // No types, unclear name
  return amt * 0.06;  // Number instead of Decimal, magic number
}
```

### React Components

```typescript
// ✅ Good - Functional with hooks, typed
interface Props {
  siteId: string;
  year: number;
}

export default function SiteStats({ siteId, year }: Props) {
  const { data, isLoading } = useSiteStats(siteId, year);

  if (isLoading) return <Skeleton />;
  if (!data) return <EmptyState />;

  return <StatsDisplay data={data} />;
}

// ❌ Bad - Class component, no types
export default class SiteStats extends Component {
  render() {
    // ...
  }
}
```

### File Naming

```
✅ kebab-case for files:    site.service.ts, use-api.ts
✅ PascalCase for components: SiteCard.tsx, DashboardLayout.tsx
✅ SCREAMING_SNAKE for constants: COMMISSION_RATES, API_BASE_URL
✅ camelCase for functions: calculateBalance, formatMoney
```

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - NEVER commit `.env` files
   - Keep `.env.example` updated
   - Use strong passwords in production

2. **Authentication**
   - JWT tokens expire in 7 days (configurable)
   - Passwords hashed with bcrypt
   - Protected routes require auth middleware

3. **Database**
   - Use parameterized queries (Prisma handles this)
   - Never expose internal IDs in URLs (use UUIDs)
   - Soft delete with `deleted_at` field

4. **API**
   - CORS configured for specific origins
   - Rate limiting on sensitive endpoints
   - Input validation with Zod schemas

---

## 🎓 Learning Resources

### Project-Specific Docs
- [Decimal.js Docs](https://mikemcl.github.io/decimal.js/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [React Query v5](https://tanstack.com/query/latest/docs/react/overview)

### Double-Entry Accounting
- Ledger entries always balance (DEBIT = CREDIT)
- Every financial event creates at least 2 entries
- Account balance = Σ DEBIT - Σ CREDIT

### Skills Loaded
When you see "finanspro-accounting" or "finanspro-testing" in context:
- I automatically apply domain knowledge
- Financial rules enforced
- Test strategies active

---

## 🚦 Status & Health Checks

### Quick Health Check

```bash
# PostgreSQL
pg_isready -h localhost -p 5432

# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API response (simple) | < 100ms | ✓ |
| API response (complex) | < 500ms | ✓ |
| Page load (FCP) | < 1.5s | ✓ |
| Bundle size (First Load) | < 200KB | Check with /optimize |

---

## 📞 When Things Go Wrong

### Step 1: Check Logs
```bash
# Backend logs (terminal running npm run dev)
# Look for errors, stack traces

# Frontend logs (browser console)
# Look for React errors, API failures
```

### Step 2: Verify Database
```bash
# Check connection
PGPASSWORD=finanspro_v3_secure_password psql -h localhost -U finanspro_v3 -d finanspro_v3 -c "SELECT 1;"

# Check data
SELECT COUNT(*) FROM account;
SELECT COUNT(*) FROM ledger_entry;
```

### Step 3: Reset Everything
```bash
# Nuclear option - fresh start
pkill -f "node.*backend"
pkill -f "next.*dev"
cd apps/backend
npx prisma db push --force-reset --accept-data-loss
node --import tsx prisma/seed.ts
npm run dev (in apps/backend)
npm run dev (in apps/frontend)
```

### Step 4: Ask for Help
```
"Claude, something is wrong with [specific issue].
Here are the logs: [paste logs]
Here's what I tried: [steps taken]"
```

I'll analyze with my finanspro-accounting and finanspro-testing skills.

---

## 🎯 Next Steps & Roadmap

### Immediate (Current Sprint)
- ✅ Core accounting system
- ✅ Site/Partner/Financier management
- ✅ Organization analytics
- ✅ Modern UI with Deep Space Blue theme

### Short-term (Next 2-4 weeks)
- [ ] Advanced reporting (PDF export)
- [ ] Multi-currency support
- [ ] Bulk transaction import
- [ ] Email notifications

### Mid-term (1-3 months)
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Advanced analytics (ML insights)
- [ ] Multi-organization support

### Long-term (3-6 months)
- [ ] White-label solution
- [ ] Blockchain integration for auditing
- [ ] AI-powered financial forecasting
- [ ] Global expansion (multi-language)

---

## 💡 Pro Tips for Working Together

### When You (CEO) Want a Feature:
1. Describe the business value
2. Show example if possible (screenshot, sketch)
3. Let me (CFO) analyze feasibility
4. I'll suggest implementation plan
5. You approve, I execute

### When I (CFO) Find an Issue:
1. I'll explain the financial/technical risk
2. Show current vs. correct implementation
3. Recommend solution
4. Wait for your approval
5. Implement fix

### Communication Style:
- **You:** High-level, business goals, user needs
- **Me:** Technical details, financial accuracy, code quality
- **Together:** Build a bulletproof financial platform

---

## 📜 License & Credits

**Project:** FinansPro v3
**Owner:** Emre Yılmaz (CEO)
**Technical Partner:** Claude (CFO)
**Framework:** Built with Claude Code
**Repository:** https://github.com/ayhankaan813/finanspro-v3

---

*This CLAUDE.md file is your project's brain. I (Claude) refer to this constantly to ensure consistency, quality, and alignment with your vision.*

**Last Updated:** 2026-02-10
**Version:** 1.0.0
