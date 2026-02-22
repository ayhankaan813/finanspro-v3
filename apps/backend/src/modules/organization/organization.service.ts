
import { Prisma, TransactionType, EntityType, LedgerEntryType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';

export interface OrgStatsQuery {
    year: number;
    month?: number;
}

export class OrganizationService {
    private ORG_ENTITY_ID = 'org-main-account';

    /**
     * Get organization account details and balance
     *
     * NOTE: Organization is an ASSET account in the ledger (balance = DEBIT - CREDIT).
     * However, org income is recorded as CREDIT (from deposit commissions, ORG_INCOME, etc.)
     * and expenses as DEBIT (ORG_EXPENSE, ORG_WITHDRAW).
     * This means: stored balance = expenses - income → negative when profitable.
     *
     * We negate the balance for display so positive = net income (what business users expect).
     * The raw DB balance stays correct for ledger math (DEBIT = CREDIT always).
     */
    async getAccount() {
        let account = await prisma.account.findUnique({
            where: { entity_id: this.ORG_ENTITY_ID },
        });

        if (!account) {
            // Auto-create if not exists (should be handled by transaction service but just in case)
            account = await prisma.account.create({
                data: {
                    entity_type: EntityType.ORGANIZATION,
                    entity_id: this.ORG_ENTITY_ID,
                    balance: new Decimal(0),
                    blocked_amount: new Decimal(0),
                    credit_limit: new Decimal(0),
                },
            });
        }

        // Negate balance for display: stored is (expenses - income), display as (income - expenses)
        return {
            ...account,
            balance: new Decimal(account.balance).negated(),
        };
    }

    /**
     * Get organization statistics (Income, Expense, Profit)
     */
    async getStats(query: OrgStatsQuery) {
        const startDate = new Date(query.year, (query.month || 1) - 1, 1);
        const endDate = query.month
            ? new Date(query.year, query.month, 1)
            : new Date(query.year + 1, 0, 1);

        // Parallelize all 4 aggregate queries
        const [commissionIncome, directIncome, expenses, payments] = await Promise.all([
            // 1a. Commission from snapshots (only for COMPLETED, non-reversed transactions)
            prisma.commissionSnapshot.aggregate({
                _sum: { organization_amount: true },
                where: {
                    created_at: { gte: startDate, lt: endDate },
                    transaction: {
                        status: 'COMPLETED',
                        deleted_at: null,
                    },
                },
            }),
            // 1b. Direct ORG_INCOME transactions
            prisma.transaction.aggregate({
                _sum: { net_amount: true },
                where: {
                    type: TransactionType.ORG_INCOME,
                    transaction_date: { gte: startDate, lt: endDate },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            }),
            // 2a. ORG_EXPENSE transactions
            prisma.transaction.aggregate({
                _sum: { net_amount: true },
                where: {
                    type: TransactionType.ORG_EXPENSE,
                    transaction_date: { gte: startDate, lt: endDate },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            }),
            // 2b. Salary Payments (PAYMENT type where source is Organization)
            prisma.transaction.aggregate({
                _sum: { net_amount: true },
                where: {
                    type: TransactionType.PAYMENT,
                    source_type: EntityType.ORGANIZATION,
                    transaction_date: { gte: startDate, lt: endDate },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            }),
        ]);

        const totalIncome = new Decimal(commissionIncome._sum.organization_amount || 0)
            .plus(directIncome._sum.net_amount || 0);

        const totalExpense = new Decimal(expenses._sum.net_amount || 0)
            .plus(payments._sum.net_amount || 0);

        const netProfit = totalIncome.minus(totalExpense);

        // 3. Get Expense Breakdown by Category (including uncategorized)
        const expenseBreakdown = await prisma.transaction.groupBy({
            by: ['category_id'],
            _sum: { net_amount: true },
            where: {
                OR: [
                    { type: TransactionType.ORG_EXPENSE },
                    { type: TransactionType.PAYMENT, source_type: EntityType.ORGANIZATION },
                ],
                transaction_date: { gte: startDate, lt: endDate },
                status: 'COMPLETED',
                deleted_at: null,
            },
        });

        // Fetch category names for categorized expenses
        const categoryIds = expenseBreakdown.map((e) => e.category_id).filter(Boolean) as string[];
        const categories = categoryIds.length > 0
            ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
            : [];

        const breakdown = expenseBreakdown.map((item) => {
            if (!item.category_id) {
                return {
                    categoryId: null,
                    categoryName: 'Genel',
                    color: '#94a3b8',
                    amount: item._sum.net_amount || new Decimal(0),
                };
            }
            const category = categories.find((c) => c.id === item.category_id);
            return {
                categoryId: item.category_id,
                categoryName: category?.name || 'Diğer',
                color: category?.color || '#cbd5e1',
                amount: item._sum.net_amount || new Decimal(0),
            };
        });

        return {
            period: {
                year: query.year,
                month: query.month,
            },
            totalIncome,
            totalExpense,
            netProfit,
            breakdown,
        };
    }

    /**
     * Get organization transactions
     */
    async getTransactions(query: { page: number; limit: number; year?: number; month?: number }) {
        const account = await this.getAccount();

        // Build date filter if year/month provided
        const dateFilter: any = {};
        if (query.year) {
            const startDate = query.month
                ? new Date(query.year, query.month - 1, 1)
                : new Date(query.year, 0, 1);
            const endDate = query.month
                ? new Date(query.year, query.month, 1)
                : new Date(query.year + 1, 0, 1);
            dateFilter.transaction_date = { gte: startDate, lt: endDate };
        }

        // Only show org-related transactions (expenses, income, withdrawals, org payments/topups)
        const whereClause = {
            account_id: account.id,
            transaction: {
                status: 'COMPLETED' as const,
                deleted_at: null,
                ...dateFilter,
                OR: [
                    { type: { in: [TransactionType.ORG_EXPENSE, TransactionType.ORG_INCOME, TransactionType.ORG_WITHDRAW] } },
                    { type: TransactionType.PAYMENT, source_type: 'ORGANIZATION' },
                    { type: TransactionType.TOP_UP, topup_source_type: 'ORGANIZATION' },
                ],
            },
        };

        const ledgerEntries = await prisma.ledgerEntry.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            include: {
                transaction: {
                    include: {
                        category: true,
                        site: { select: { name: true } },
                    },
                },
            },
        });

        const total = await prisma.ledgerEntry.count({
            where: whereClause,
        });

        // Map to a cleaner format
        // NOTE: balance_after is negated for same reason as getAccount() -
        // stored balance is (expenses - income), display as (income - expenses)
        const items = ledgerEntries.map((entry) => {
            // @ts-ignore - Transaction relation is loaded
            const tx = entry.transaction;

            return {
                id: entry.id, // Use ledger entry ID as unique key
                transactionId: tx.id,
                date: tx.transaction_date,
                type: tx.type,
                description: tx.description || entry.description,
                amount: entry.amount,
                balance_after: new Decimal(entry.balance_after).negated(),
                entry_type: entry.entry_type, // DEBIT (Expense/Out) or CREDIT (Income/In)
                category: tx.category,
                related_entity: tx.site?.name || 'Organizasyon', // Financier relation missing, default to Org or enhance later
            };
        });

        return {
            items,
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        };
    }
    /**
     * Get advanced analytics (Profit by Site, Busy Days, Monthly Trends)
     */
    async getAnalytics(query: OrgStatsQuery) {
        const startDate = new Date(query.year, (query.month || 1) - 1, 1);
        const endDate = query.month
            ? new Date(query.year, query.month, 1)
            : new Date(query.year + 1, 0, 1);

        // Fetch profitBySite snapshots and busyDays transactions in parallel
        const [snapshots, transactions] = await Promise.all([
            // 1. Profit by Site - CommissionSnapshots grouped by Site
            prisma.commissionSnapshot.findMany({
                where: {
                    created_at: { gte: startDate, lt: endDate },
                    transaction: {
                        status: 'COMPLETED',
                        deleted_at: null,
                    },
                },
                include: {
                    transaction: {
                        select: {
                            site: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            // 2. Operational Intensity (Busy Days) - transaction dates
            prisma.transaction.findMany({
                where: {
                    transaction_date: { gte: startDate, lt: endDate },
                    status: 'COMPLETED',
                    type: { not: TransactionType.REVERSAL },
                    deleted_at: null,
                },
                select: { transaction_date: true },
            }),
        ]);

        const siteProfitMap = new Map<string, { name: string; amount: Decimal }>();

        for (const snap of snapshots) {
            const site = snap.transaction?.site;
            if (site) {
                const current = siteProfitMap.get(site.id) || { name: site.name, amount: new Decimal(0) };
                current.amount = current.amount.plus(snap.organization_amount);
                siteProfitMap.set(site.id, current);
            }
        }

        const profitBySite = Array.from(siteProfitMap.values())
            .map(item => ({ name: item.name, amount: item.amount.toNumber() }))
            .sort((a, b) => b.amount - a.amount);

        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const busyDaysMap = new Array(7).fill(0);

        for (const tx of transactions) {
            const dayIndex = tx.transaction_date.getDay(); // 0 = Sunday
            busyDaysMap[dayIndex]++;
        }

        // Reorder to start from Monday (Turkey standard)
        // 0=Sun, 1=Mon... -> We want Mon, Tue, ..., Sun
        const busyDays = [
            { day: 'Pazartesi', count: busyDaysMap[1] },
            { day: 'Salı', count: busyDaysMap[2] },
            { day: 'Çarşamba', count: busyDaysMap[3] },
            { day: 'Perşembe', count: busyDaysMap[4] },
            { day: 'Cuma', count: busyDaysMap[5] },
            { day: 'Cumartesi', count: busyDaysMap[6] },
            { day: 'Pazar', count: busyDaysMap[0] },
        ];

        // 3. Monthly Trend (Income vs Expense for the year)
        // Use groupBy queries instead of 48 sequential queries (4 per month x 12)
        const yearStart = new Date(query.year, 0, 1);
        const yearEnd = new Date(query.year + 1, 0, 1);
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        // Fetch all yearly data in 4 parallel queries instead of 48 sequential
        const [yearCommissions, yearDirectIncome, yearExpenses, yearPayments] = await Promise.all([
            // Commission income by month - use raw query for month extraction
            prisma.commissionSnapshot.findMany({
                where: {
                    created_at: { gte: yearStart, lt: yearEnd },
                    transaction: { status: 'COMPLETED', deleted_at: null },
                },
                select: { organization_amount: true, created_at: true },
            }),
            // Direct ORG_INCOME by month
            prisma.transaction.findMany({
                where: {
                    type: TransactionType.ORG_INCOME,
                    transaction_date: { gte: yearStart, lt: yearEnd },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
                select: { net_amount: true, transaction_date: true },
            }),
            // ORG_EXPENSE by month
            prisma.transaction.findMany({
                where: {
                    type: TransactionType.ORG_EXPENSE,
                    transaction_date: { gte: yearStart, lt: yearEnd },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
                select: { net_amount: true, transaction_date: true },
            }),
            // PAYMENT (org source) by month
            prisma.transaction.findMany({
                where: {
                    type: TransactionType.PAYMENT,
                    source_type: EntityType.ORGANIZATION,
                    transaction_date: { gte: yearStart, lt: yearEnd },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
                select: { net_amount: true, transaction_date: true },
            }),
        ]);

        // Aggregate into monthly buckets in JS (much faster than 48 DB queries)
        const monthlyIncome = new Array(12).fill(null).map(() => new Decimal(0));
        const monthlyExpense = new Array(12).fill(null).map(() => new Decimal(0));

        for (const snap of yearCommissions) {
            const m = snap.created_at.getMonth();
            monthlyIncome[m] = monthlyIncome[m].plus(snap.organization_amount);
        }
        for (const tx of yearDirectIncome) {
            const m = tx.transaction_date.getMonth();
            monthlyIncome[m] = monthlyIncome[m].plus(tx.net_amount);
        }
        for (const tx of yearExpenses) {
            const m = tx.transaction_date.getMonth();
            monthlyExpense[m] = monthlyExpense[m].plus(tx.net_amount);
        }
        for (const tx of yearPayments) {
            const m = tx.transaction_date.getMonth();
            monthlyExpense[m] = monthlyExpense[m].plus(tx.net_amount);
        }

        const monthlyTrend = monthNames.map((name, i) => ({
            month: name,
            income: monthlyIncome[i].toNumber(),
            expense: monthlyExpense[i].toNumber(),
            profit: monthlyIncome[i].minus(monthlyExpense[i]).toNumber(),
        }));

        return {
            period: { year: query.year, month: query.month },
            profitBySite,
            busyDays,
            monthlyTrend,
        };
    }

    /**
     * Get daily cash flow for the last N days
     * Returns daily total financier balance (= total cash in the system)
     */
    async getDailyCashFlow(days: number = 7) {
        // Get all financier accounts
        const financierAccounts = await prisma.account.findMany({
            where: { entity_type: EntityType.FINANCIER },
            select: { id: true, balance: true, entity_id: true },
        });

        // Current total = sum of all financier balances
        const currentTotal = financierAccounts.reduce(
            (sum, acc) => sum.plus(acc.balance),
            new Decimal(0)
        );

        // For each day going back, we need the end-of-day balance
        // We'll calculate by looking at daily transaction volumes on financier accounts
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const accountIds = financierAccounts.map(a => a.id);

        // Get all ledger entries for financier accounts in the period, grouped by day
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                account_id: { in: accountIds },
                created_at: { gte: startDate },
                transaction: {
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            },
            select: {
                amount: true,
                entry_type: true,
                created_at: true,
            },
            orderBy: { created_at: 'asc' },
        });

        // Build daily net changes
        const dailyChanges = new Map<string, Decimal>();
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

        for (const entry of entries) {
            const dateKey = entry.created_at.toISOString().split('T')[0];
            const current = dailyChanges.get(dateKey) || new Decimal(0);
            // DEBIT increases financier balance, CREDIT decreases it
            const change = entry.entry_type === LedgerEntryType.DEBIT
                ? new Decimal(entry.amount)
                : new Decimal(entry.amount).negated();
            dailyChanges.set(dateKey, current.plus(change));
        }

        // Reconstruct daily end-of-day balances going backwards from current
        const result: Array<{ date: string; name: string; total: number }> = [];
        let runningBalance = currentTotal;

        // Build list of days from today going back
        const daysList: string[] = [];
        for (let i = 0; i <= days; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            daysList.push(d.toISOString().split('T')[0]);
        }

        // Walk backwards: today's balance is currentTotal,
        // yesterday's balance = today's balance - today's net change
        for (let i = 0; i < daysList.length; i++) {
            const dateKey = daysList[i];
            const dateObj = new Date(dateKey);
            const dayName = dayNames[dateObj.getDay()];

            if (i === 0) {
                // Today
                result.unshift({
                    date: dateKey,
                    name: 'Bugün',
                    total: runningBalance.toNumber(),
                });
            } else {
                // Subtract today's changes to get yesterday's end-of-day
                const todayChange = dailyChanges.get(daysList[i - 1]) || new Decimal(0);
                runningBalance = runningBalance.minus(todayChange);
                result.unshift({
                    date: dateKey,
                    name: dayName,
                    total: runningBalance.toNumber(),
                });
            }
        }

        // Remove the extra day and return only `days` entries
        return result.slice(result.length - days);
    }
}

export const organizationService = new OrganizationService();
