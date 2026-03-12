import { PendingStatus } from '@prisma/client';
import prisma from '../../shared/prisma/client.js';
import { transactionService } from '../transaction/transaction.service.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';

// OPERATOR: Yatırım ve çekim direkt, geri kalan onay
// PARTNER: Ödeme, takviye, borç talebi → onay
const OPERATOR_DIRECT_TYPES = ['deposit', 'withdrawal'];

/**
 * İşlem tipinin verilen role göre direkt mi yoksa onay mı gerektirdiğini belirle
 */
export function requiresApproval(role: string, transactionType: string): boolean {
  if (role === 'ADMIN') return false; // Admin her şeyi direkt yapar
  if (role === 'OPERATOR' || role === 'USER') {
    return !OPERATOR_DIRECT_TYPES.includes(transactionType);
  }
  if (role === 'PARTNER') return true; // Partner her zaman onay gerektirir
  return true; // default: onay gerek
}

/**
 * İşlem tipi için insan-okunur açıklama oluştur
 */
function buildDescription(type: string, payload: any): string {
  const typeLabels: Record<string, string> = {
    deposit: 'Yatırım',
    withdrawal: 'Çekim',
    delivery: 'Teslim',
    'site-delivery': 'Site Teslim',
    payment: 'Ödeme',
    'partner-payment': 'Partner Ödeme',
    'top-up': 'Takviye',
    'external-debt': 'Dış Borç',
    'external-payment': 'Dış Ödeme',
    'org-expense': 'Org. Gider',
    'org-income': 'Org. Gelir',
    'org-withdraw': 'Org. Çekim',
    'financier-transfer': 'Finansör Transfer',
  };
  const label = typeLabels[type] || type;
  const amount = payload.amount || payload.gross_amount || '?';
  return `${label} talebi — ${Number(amount).toLocaleString('tr-TR')} ₺`;
}

class PendingTransactionService {
  /**
   * Onay bekleyen işlem oluştur
   */
  async create(input: {
    transaction_type: string;
    payload: Record<string, any>;
    requested_by: string;
    requester_role: string;
  }) {
    const description = buildDescription(input.transaction_type, input.payload);

    const pending = await prisma.pendingTransaction.create({
      data: {
        transaction_type: input.transaction_type,
        payload: input.payload,
        description,
        requested_by: input.requested_by,
        requester_role: input.requester_role,
        status: 'PENDING',
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Admin'e bildirim gönder
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', is_active: true, deleted_at: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          user_id: admin.id,
          type: 'TRANSACTION_PENDING',
          title: 'Yeni İşlem Talebi',
          message: `${pending.requester.name} — ${description}`,
          metadata: { pendingId: pending.id, type: input.transaction_type },
        },
      }).catch(() => {});
    }

    logger.info({ pendingId: pending.id, type: input.transaction_type }, 'Pending transaction created');
    return pending;
  }

  /**
   * Bekleyen işlemleri listele
   */
  async findAll(params: {
    status?: string;
    transaction_type?: string;
    requested_by?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.transaction_type) where.transaction_type = params.transaction_type;
    if (params.requested_by) where.requested_by = params.requested_by;

    const [items, total] = await Promise.all([
      prisma.pendingTransaction.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true, role: true } },
          reviewer: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pendingTransaction.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Tek pending transaction getir
   */
  async findById(id: string) {
    const pending = await prisma.pendingTransaction.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!pending) throw new NotFoundError('PendingTransaction', id);
    return pending;
  }

  /**
   * İşlemi onayla — gerçek transaction oluştur
   */
  async approve(id: string, reviewerId: string, note?: string) {
    const pending = await prisma.pendingTransaction.findUnique({ where: { id } });
    if (!pending) throw new NotFoundError('PendingTransaction', id);
    if (pending.status !== 'PENDING') {
      throw new Error('Bu talep zaten işlenmiş');
    }

    const payload = pending.payload as Record<string, any>;
    let resultTransactionId: string | undefined;

    try {
      // İşlem tipine göre asıl service'i çağır
      logger.info({ type: pending.transaction_type, payload }, 'Executing pending transaction');
      const result = await this.executeTransaction(pending.transaction_type, payload, reviewerId);
      resultTransactionId = result?.id;
    } catch (error: any) {
      logger.error({ error: error.message, type: pending.transaction_type }, 'Pending transaction execution failed');
      // İşlem başarısız — pending'i hata durumuyla bırak ama REJECTED yapma
      // (Admin düzeltip tekrar deneyebilsin)
      throw error;
    }

    // Pending'i güncelle
    const approved = await prisma.pendingTransaction.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewed_by: reviewerId,
        review_note: note || null,
        reviewed_at: new Date(),
        result_transaction_id: resultTransactionId || null,
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Talep edene bildirim
    await prisma.notification.create({
      data: {
        user_id: pending.requested_by,
        type: 'TRANSACTION_APPROVED',
        title: 'İşlem Talebi Onaylandı ✅',
        message: pending.description || 'İşlem talebiniz onaylandı',
        metadata: { pendingId: id, transactionId: resultTransactionId },
      },
    }).catch(() => {});

    logger.info({ pendingId: id, result: resultTransactionId }, 'Pending transaction approved');
    return approved;
  }

  /**
   * İşlemi reddet
   */
  async reject(id: string, reviewerId: string, note?: string) {
    const pending = await prisma.pendingTransaction.findUnique({ where: { id } });
    if (!pending) throw new NotFoundError('PendingTransaction', id);
    if (pending.status !== 'PENDING') {
      throw new Error('Bu talep zaten işlenmiş');
    }

    const rejected = await prisma.pendingTransaction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewed_by: reviewerId,
        review_note: note || null,
        reviewed_at: new Date(),
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Talep edene bildirim
    await prisma.notification.create({
      data: {
        user_id: pending.requested_by,
        type: 'TRANSACTION_REJECTED',
        title: 'İşlem Talebi Reddedildi ❌',
        message: `${pending.description || 'İşlem talebiniz'} reddedildi${note ? ': ' + note : ''}`,
        metadata: { pendingId: id },
      },
    }).catch(() => {});

    logger.info({ pendingId: id }, 'Pending transaction rejected');
    return rejected;
  }

  /**
   * Bekleyen işlem sayısı
   * Admin: Tüm pending sayısı
   * Partner: Sadece kendi talepleri
   */
  async getPendingCount(requestedBy?: string) {
    const where: any = { status: 'PENDING' };
    if (requestedBy) where.requested_by = requestedBy;
    return prisma.pendingTransaction.count({ where });
  }

  /**
   * Transaction tipine göre gerçek işlemi yürüt
   */
  private async executeTransaction(type: string, payload: any, executedBy: string): Promise<{ id: string } | null> {
    switch (type) {
      case 'deposit':
        return transactionService.processDeposit(payload, executedBy);
      case 'withdrawal':
        return transactionService.processWithdrawal(payload, executedBy);
      case 'site-delivery':
        return transactionService.processSiteDelivery(payload, executedBy);
      case 'delivery':
        return transactionService.processDelivery(payload, executedBy);
      case 'payment':
        return transactionService.processPayment(payload, executedBy);
      case 'partner-payment':
        return transactionService.processPartnerPayment(payload, executedBy);
      case 'top-up':
        return transactionService.processTopUp(payload, executedBy);
      case 'external-debt':
        if (payload.direction === 'in') {
          const { direction, ...rest } = payload;
          return transactionService.processExternalDebtIn(rest, executedBy);
        } else {
          const { direction, ...rest } = payload;
          return transactionService.processExternalDebtOut(rest, executedBy);
        }
      case 'external-payment':
        return transactionService.processExternalPayment(payload, executedBy);
      case 'org-expense':
        return transactionService.processOrgExpense(payload, executedBy);
      case 'org-income':
        return transactionService.processOrgIncome(payload, executedBy);
      case 'org-withdraw':
        return transactionService.processOrgWithdraw(payload, executedBy);
      case 'financier-transfer':
        return transactionService.processFinancierTransfer(payload, executedBy);
      default:
        throw new Error(`Bilinmeyen işlem tipi: ${type}`);
    }
  }
}

export const pendingService = new PendingTransactionService();
