
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

        // 1. Calculate Total Income (Commissions + ORG_INCOME)
        // - Commission from snapshots (only for COMPLETED, non-reversed transactions)
        const commissionIncome = await prisma.commissionSnapshot.aggregate({
            _sum: { organization_amount: true },
            where: {
                created_at: { gte: startDate, lt: endDate },
                transaction: {
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            },
        });

        // - Direct ORG_INCOME transactions
        const directIncome = await prisma.transaction.aggregate({
            _sum: { net_amount: true },
            where: {
                type: TransactionType.ORG_INCOME,
                transaction_date: { gte: startDate, lt: endDate },
                status: 'COMPLETED',
                deleted_at: null,
            },
        });

        // 2. Calculate Total Expenses (ORG_EXPENSE + Salaries via PAYMENT)
        // - ORG_EXPENSE transactions
        const expenses = await prisma.transaction.aggregate({
            _sum: { net_amount: true },
            where: {
                type: TransactionType.ORG_EXPENSE,
                transaction_date: { gte: startDate, lt: endDate },
                status: 'COMPLETED',
                deleted_at: null,
            },
        });

        // - Salary Payments (PAYMENT type where source is Organization)
        // expenses via PAYMENT type are recorded as DEBIT on Organization account
        // We can query transactions of type PAYMENT where source_type = ORGANIZATION
        const payments = await prisma.transaction.aggregate({
            _sum: { net_amount: true },
            where: {
                type: TransactionType.PAYMENT,
                source_type: EntityType.ORGANIZATION,
                transaction_date: { gte: startDate, lt: endDate },
                status: 'COMPLETED',
                deleted_at: null,
            },
        });

        const totalIncome = new Decimal(commissionIncome._sum.organization_amount || 0)
            .plus(directIncome._sum.net_amount || 0);

        const totalExpense = new Decimal(expenses._sum.net_amount || 0)
            .plus(payments._sum.net_amount || 0);

        const netProfit = totalIncome.minus(totalExpense);

        // 3. Get Expense Breakdown by Category
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
                category_id: { not: null },
            },
        });

        // Fetch category names
        const categories = await prisma.category.findMany({
            where: {
                id: { in: expenseBreakdown.map((e) => e.category_id!).filter(Boolean) },
            },
        });

        const breakdown = expenseBreakdown.map((item) => {
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
    async getTransactions(query: { page: number; limit: number }) {
        const account = await this.getAccount();

        // Only show org-related transactions (expenses, income, withdrawals, org payments/topups)
        const whereClause = {
            account_id: account.id,
            transaction: {
                status: 'COMPLETED' as const,
                deleted_at: null,
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

        // 1. Profit by Site
        // We need to look at CommissionSnapshots and sum organization_amount grouped by Site
        // Only include snapshots for COMPLETED (non-reversed) transactions
        const snapshots = await prisma.commissionSnapshot.findMany({
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
        });

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
            .sort((a, b) => b.amount - a.amount); // Sort by highest profit

        // 2. Operational Intensity (Busy Days)
        // Count transactions by day of week (exclude reversals and reversed)
        const transactions = await prisma.transaction.findMany({
            where: {
                transaction_date: { gte: startDate, lt: endDate },
                status: 'COMPLETED',
                type: { not: TransactionType.REVERSAL },
                deleted_at: null,
            },
            select: { transaction_date: true },
        });

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
        // Calculate for the entire year regardless of month filter
        const monthlyTrend = [];
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        for (let m = 0; m < 12; m++) {
            const monthStart = new Date(query.year, m, 1);
            const monthEnd = new Date(query.year, m + 1, 1);

            // Calculate income for this month (only COMPLETED, non-reversed transactions)
            const monthCommission = await prisma.commissionSnapshot.aggregate({
                _sum: { organization_amount: true },
                where: {
                    created_at: { gte: monthStart, lt: monthEnd },
                    transaction: {
                        status: 'COMPLETED',
                        deleted_at: null,
                    },
                },
            });

            const monthDirectIncome = await prisma.transaction.aggregate({
                _sum: { net_amount: true },
                where: {
                    type: TransactionType.ORG_INCOME,
                    transaction_date: { gte: monthStart, lt: monthEnd },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            });

            // Calculate expenses for this month
            const monthExpenses = await prisma.transaction.aggregate({
                _sum: { net_amount: true },
                where: {
                    type: TransactionType.ORG_EXPENSE,
                    transaction_date: { gte: monthStart, lt: monthEnd },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            });

            const monthPayments = await prisma.transaction.aggregate({
                _sum: { net_amount: true },
                where: {
                    type: TransactionType.PAYMENT,
                    source_type: EntityType.ORGANIZATION,
                    transaction_date: { gte: monthStart, lt: monthEnd },
                    status: 'COMPLETED',
                    deleted_at: null,
                },
            });

            const income = new Decimal(monthCommission._sum.organization_amount || 0)
                .plus(monthDirectIncome._sum.net_amount || 0);

            const expense = new Decimal(monthExpenses._sum.net_amount || 0)
                .plus(monthPayments._sum.net_amount || 0);

            monthlyTrend.push({
                month: monthNames[m],
                income: income.toNumber(),
                expense: expense.toNumber(),
                profit: income.minus(expense).toNumber(),
            });
        }

        return {
            period: { year: query.year, month: query.month },
            profitBySite,
            busyDays,
            monthlyTrend,
        };
    }
}

export const organizationService = new OrganizationService();
