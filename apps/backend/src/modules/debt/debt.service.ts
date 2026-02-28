import { Decimal } from 'decimal.js';
import { DebtStatus } from '@prisma/client';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, BusinessError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type { CreateDebtInput, CreateDebtPaymentInput, CancelDebtInput, DebtQueryInput } from './debt.schema.js';

// Standard include for debt queries — always include lender and borrower info
const DEBT_INCLUDE = {
  lender: { select: { id: true, name: true, code: true } },
  borrower: { select: { id: true, name: true, code: true } },
};

const DEBT_WITH_PAYMENTS_INCLUDE = {
  ...DEBT_INCLUDE,
  payments: {
    orderBy: { created_at: 'desc' as const },
  },
};

class DebtService {
  /**
   * Create a new debt between two financiers.
   * DEBT-01: Borç verme/alma kaydı oluşturma
   * DEBT-04: Açıklama eklenebilir
   */
  async create(input: CreateDebtInput, createdBy: string) {
    // Validate: lender and borrower must be different
    if (input.lender_id === input.borrower_id) {
      throw new BusinessError(
        'Borç veren ve borç alan finansör aynı olamaz',
        'SAME_FINANCIER'
      );
    }

    // Validate: both financiers must exist and be active
    const [lender, borrower] = await Promise.all([
      prisma.financier.findUnique({ where: { id: input.lender_id } }),
      prisma.financier.findUnique({ where: { id: input.borrower_id } }),
    ]);

    if (!lender) {
      throw new NotFoundError('Borç veren finansör', input.lender_id);
    }
    if (!borrower) {
      throw new NotFoundError('Borç alan finansör', input.borrower_id);
    }
    if (lender.deleted_at || !lender.is_active) {
      throw new BusinessError(
        'Borç veren finansör aktif değil',
        'LENDER_INACTIVE'
      );
    }
    if (borrower.deleted_at || !borrower.is_active) {
      throw new BusinessError(
        'Borç alan finansör aktif değil',
        'BORROWER_INACTIVE'
      );
    }

    const amount = new Decimal(input.amount);

    const debt = await prisma.debt.create({
      data: {
        lender_id: input.lender_id,
        borrower_id: input.borrower_id,
        amount: amount.toNumber(),
        remaining_amount: amount.toNumber(),
        status: DebtStatus.ACTIVE,
        description: input.description || null,
        created_by: createdBy,
      },
      include: DEBT_INCLUDE,
    });

    logger.info(
      { debtId: debt.id, lenderId: input.lender_id, borrowerId: input.borrower_id, amount: amount.toNumber() },
      'Debt created'
    );

    return debt;
  }

  /**
   * Make a payment against an active debt.
   * DEBT-02: Kısmi veya tam ödeme
   * DEBT-04: Ödemeye açıklama eklenebilir
   */
  async pay(debtId: string, input: CreateDebtPaymentInput, createdBy: string) {
    const debt = await prisma.debt.findUnique({
      where: { id: debtId },
      include: DEBT_INCLUDE,
    });

    if (!debt) {
      throw new NotFoundError('Borç', debtId);
    }

    if (debt.status !== DebtStatus.ACTIVE) {
      throw new BusinessError(
        `Bu borca ödeme yapılamaz. Borç durumu: ${debt.status}`,
        'DEBT_NOT_ACTIVE'
      );
    }

    const paymentAmount = new Decimal(input.amount);
    const remainingAmount = new Decimal(debt.remaining_amount.toString());

    // Payment must not exceed remaining amount
    if (paymentAmount.greaterThan(remainingAmount)) {
      throw new BusinessError(
        `Ödeme tutarı kalan borçtan fazla olamaz. Kalan: ${remainingAmount.toFixed(2)}, Ödeme: ${paymentAmount.toFixed(2)}`,
        'PAYMENT_EXCEEDS_REMAINING'
      );
    }

    const newRemaining = remainingAmount.minus(paymentAmount);
    const newStatus = newRemaining.isZero() ? DebtStatus.PAID : DebtStatus.ACTIVE;

    // Atomic transaction: create payment + update debt remaining/status
    const [payment, updatedDebt] = await prisma.$transaction([
      prisma.debtPayment.create({
        data: {
          debt_id: debtId,
          amount: paymentAmount.toNumber(),
          description: input.description || null,
          created_by: createdBy,
        },
      }),
      prisma.debt.update({
        where: { id: debtId },
        data: {
          remaining_amount: newRemaining.toNumber(),
          status: newStatus,
        },
        include: DEBT_WITH_PAYMENTS_INCLUDE,
      }),
    ]);

    logger.info(
      {
        debtId,
        paymentId: payment.id,
        paymentAmount: paymentAmount.toNumber(),
        newRemaining: newRemaining.toNumber(),
        newStatus,
      },
      'Debt payment created'
    );

    return updatedDebt;
  }

  /**
   * Cancel a debt that has no payments.
   * DEBT-03: Yanlış girilen borç iptali
   */
  async cancel(debtId: string, input: CancelDebtInput, createdBy: string) {
    const debt = await prisma.debt.findUnique({
      where: { id: debtId },
      include: {
        ...DEBT_INCLUDE,
        payments: true,
      },
    });

    if (!debt) {
      throw new NotFoundError('Borç', debtId);
    }

    if (debt.status !== DebtStatus.ACTIVE) {
      throw new BusinessError(
        `Bu borç iptal edilemez. Borç durumu: ${debt.status}`,
        'DEBT_NOT_ACTIVE'
      );
    }

    // Only debts with zero payments can be cancelled
    if (debt.payments.length > 0) {
      throw new BusinessError(
        'Ödemesi olan borç iptal edilemez. Önce ödemeleri geri alın veya borcun kapanmasını bekleyin.',
        'DEBT_HAS_PAYMENTS'
      );
    }

    const updatedDebt = await prisma.debt.update({
      where: { id: debtId },
      data: {
        status: DebtStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: input.cancellation_reason || null,
      },
      include: DEBT_INCLUDE,
    });

    logger.info(
      { debtId, reason: input.cancellation_reason },
      'Debt cancelled'
    );

    return updatedDebt;
  }

  /**
   * Find a single debt by ID with payments.
   */
  async findById(id: string) {
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: DEBT_WITH_PAYMENTS_INCLUDE,
    });

    if (!debt) {
      throw new NotFoundError('Borç', id);
    }

    return debt;
  }

  /**
   * List debts with optional filters and pagination.
   */
  async findAll(query: DebtQueryInput) {
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.financier_id) {
      where.OR = [
        { lender_id: query.financier_id },
        { borrower_id: query.financier_id },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.debt.findMany({
        where,
        include: DEBT_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.debt.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get aggregate summary of all debts.
   * Used by the Borç/Alacak dashboard (Phase 6 PAGE-01).
   */
  async getSummary() {
    const activeDebts = await prisma.debt.findMany({
      where: { status: DebtStatus.ACTIVE },
      select: {
        amount: true,
        remaining_amount: true,
      },
    });

    let totalDebt = new Decimal(0);
    let totalPaid = new Decimal(0);

    for (const debt of activeDebts) {
      const amount = new Decimal(debt.amount.toString());
      const remaining = new Decimal(debt.remaining_amount.toString());
      totalDebt = totalDebt.plus(remaining);
      totalPaid = totalPaid.plus(amount.minus(remaining));
    }

    // Count all active debts
    const activeDebtCount = activeDebts.length;

    // Total ever created (all statuses)
    const totalCreated = await prisma.debt.count();

    // Total paid debts
    const paidCount = await prisma.debt.count({
      where: { status: DebtStatus.PAID },
    });

    // Total cancelled debts
    const cancelledCount = await prisma.debt.count({
      where: { status: DebtStatus.CANCELLED },
    });

    return {
      total_active_debt: totalDebt.toNumber(),
      total_paid: totalPaid.toNumber(),
      active_debt_count: activeDebtCount,
      total_created: totalCreated,
      paid_count: paidCount,
      cancelled_count: cancelledCount,
    };
  }

  /**
   * Get per-financier debt summary (who owes whom).
   * Returns list of financiers with their total owed (borç) and receivable (alacak).
   */
  async getFinancierSummary() {
    const financiers = await prisma.financier.findMany({
      where: { is_active: true, deleted_at: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    const activeDebts = await prisma.debt.findMany({
      where: { status: DebtStatus.ACTIVE },
      select: {
        lender_id: true,
        borrower_id: true,
        remaining_amount: true,
      },
    });

    const summary = financiers.map((financier) => {
      let totalReceivable = new Decimal(0); // alacak — this financier lent money
      let totalOwed = new Decimal(0);       // borc — this financier borrowed money

      for (const debt of activeDebts) {
        const remaining = new Decimal(debt.remaining_amount.toString());
        if (debt.lender_id === financier.id) {
          totalReceivable = totalReceivable.plus(remaining);
        }
        if (debt.borrower_id === financier.id) {
          totalOwed = totalOwed.plus(remaining);
        }
      }

      return {
        financier: { id: financier.id, name: financier.name, code: financier.code },
        total_receivable: totalReceivable.toNumber(),
        total_owed: totalOwed.toNumber(),
        net_position: totalReceivable.minus(totalOwed).toNumber(),
      };
    });

    return summary;
  }

  /**
   * Get cross-matrix of debts between financiers.
   * Returns matrix[lender_id][borrower_id] = remaining_amount.
   */
  async getMatrix() {
    const financiers = await prisma.financier.findMany({
      where: { is_active: true, deleted_at: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    const activeDebts = await prisma.debt.findMany({
      where: { status: DebtStatus.ACTIVE },
      select: {
        lender_id: true,
        borrower_id: true,
        remaining_amount: true,
      },
    });

    // Build matrix: matrix[lender_id][borrower_id] = total remaining
    const matrixMap = new Map<string, Map<string, Decimal>>();

    for (const debt of activeDebts) {
      if (!matrixMap.has(debt.lender_id)) {
        matrixMap.set(debt.lender_id, new Map());
      }
      const row = matrixMap.get(debt.lender_id)!;
      const current = row.get(debt.borrower_id) || new Decimal(0);
      row.set(debt.borrower_id, current.plus(new Decimal(debt.remaining_amount.toString())));
    }

    // Convert to serializable format
    const matrix: Array<{
      lender: { id: string; name: string; code: string };
      borrower: { id: string; name: string; code: string };
      amount: number;
    }> = [];

    for (const [lenderId, borrowerMap] of matrixMap) {
      const lender = financiers.find((f) => f.id === lenderId);
      if (!lender) continue;

      for (const [borrowerId, amount] of borrowerMap) {
        const borrower = financiers.find((f) => f.id === borrowerId);
        if (!borrower) continue;

        matrix.push({
          lender: { id: lender.id, name: lender.name, code: lender.code },
          borrower: { id: borrower.id, name: borrower.name, code: borrower.code },
          amount: amount.toNumber(),
        });
      }
    }

    return {
      financiers: financiers.map((f) => ({ id: f.id, name: f.name, code: f.code })),
      matrix,
    };
  }
}

export const debtService = new DebtService();
