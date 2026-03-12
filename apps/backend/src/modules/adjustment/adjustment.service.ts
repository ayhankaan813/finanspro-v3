import { Prisma, AdjustmentType, AdjustmentStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, BusinessError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import { notificationService } from '../notification/notification.service.js';
import { auditLogService } from '../../shared/audit-log.js';
import { transactionService } from '../transaction/transaction.service.js';

export class AdjustmentService {
  /**
   * Request an amount change on a transaction
   */
  async requestAmountChange(
    transactionId: string,
    newAmount: string,
    reason: string,
    userId: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundError('Transaction', transactionId);
    if (transaction.status !== 'COMPLETED') {
      throw new BusinessError('Sadece tamamlanmış işlemler düzenlenebilir', 'NOT_COMPLETED');
    }

    const adjustment = await prisma.adjustment.create({
      data: {
        type: AdjustmentType.TRANSACTION_AMOUNT_CHANGE,
        status: AdjustmentStatus.PENDING,
        target_type: 'Transaction',
        target_id: transactionId,
        field_name: 'gross_amount',
        old_value: { amount: transaction.gross_amount.toString() },
        new_value: { amount: newAmount },
        reason,
        evidence_urls: [],
        requested_by: userId,
      },
    });

    // Notify admins
    await notificationService.notifyAdmins({
      type: 'ADJUSTMENT_PENDING',
      title: 'Tutar Düzeltme Talebi',
      message: `${transaction.type} işleminde ${transaction.gross_amount} → ${newAmount} TL tutar değişikliği talep edildi.`,
      entityType: 'Adjustment',
      entityId: adjustment.id,
      actionUrl: '/approvals',
      actionText: 'İncele',
      priority: 'HIGH',
    });

    logger.info({ adjustmentId: adjustment.id, transactionId }, 'Amount change requested');
    return adjustment;
  }

  /**
   * Request a date change on a transaction
   */
  async requestDateChange(
    transactionId: string,
    newDate: string,
    reason: string,
    userId: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundError('Transaction', transactionId);
    if (transaction.status !== 'COMPLETED') {
      throw new BusinessError('Sadece tamamlanmış işlemler düzenlenebilir', 'NOT_COMPLETED');
    }

    const adjustment = await prisma.adjustment.create({
      data: {
        type: AdjustmentType.TRANSACTION_DATE_CHANGE,
        status: AdjustmentStatus.PENDING,
        target_type: 'Transaction',
        target_id: transactionId,
        field_name: 'transaction_date',
        old_value: { date: transaction.transaction_date.toISOString() },
        new_value: { date: newDate },
        reason,
        evidence_urls: [],
        requested_by: userId,
      },
    });

    await notificationService.notifyAdmins({
      type: 'ADJUSTMENT_PENDING',
      title: 'Tarih Düzeltme Talebi',
      message: `${transaction.type} işleminin tarihi değiştirilmek isteniyor.`,
      entityType: 'Adjustment',
      entityId: adjustment.id,
      actionUrl: '/approvals',
      actionText: 'İncele',
      priority: 'NORMAL',
    });

    logger.info({ adjustmentId: adjustment.id, transactionId }, 'Date change requested');
    return adjustment;
  }

  /**
   * Request deletion (reversal) of a transaction
   */
  async requestDelete(
    transactionId: string,
    reason: string,
    userId: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundError('Transaction', transactionId);
    if (transaction.status === 'REVERSED') {
      throw new BusinessError('Bu işlem zaten iptal edilmiş', 'ALREADY_REVERSED');
    }

    const adjustment = await prisma.adjustment.create({
      data: {
        type: AdjustmentType.TRANSACTION_DELETE,
        status: AdjustmentStatus.PENDING,
        target_type: 'Transaction',
        target_id: transactionId,
        old_value: {
          type: transaction.type,
          amount: transaction.gross_amount.toString(),
          status: transaction.status,
        },
        new_value: { status: 'REVERSED' },
        reason,
        evidence_urls: [],
        requested_by: userId,
      },
    });

    await notificationService.notifyAdmins({
      type: 'ADJUSTMENT_PENDING',
      title: 'İşlem Silme Talebi',
      message: `${transaction.type} işlemi (${transaction.gross_amount} TL) silinmek isteniyor. Sebep: ${reason}`,
      entityType: 'Adjustment',
      entityId: adjustment.id,
      actionUrl: '/approvals',
      actionText: 'İncele',
      priority: 'URGENT',
    });

    logger.info({ adjustmentId: adjustment.id, transactionId }, 'Delete requested');
    return adjustment;
  }

  /**
   * Get all pending adjustments
   */
  async getPendingAdjustments() {
    return prisma.adjustment.findMany({
      where: { status: AdjustmentStatus.PENDING },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get adjustment by ID
   */
  async getById(id: string) {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!adjustment) throw new NotFoundError('Adjustment', id);
    return adjustment;
  }

  /**
   * Approve and apply an adjustment
   */
  async approveAdjustment(
    adjustmentId: string,
    reviewerId: string,
    reviewNote?: string
  ) {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: adjustmentId },
    });
    if (!adjustment) throw new NotFoundError('Adjustment', adjustmentId);
    if (adjustment.status !== 'PENDING') {
      throw new BusinessError(`Düzeltme PENDING değil (mevcut: ${adjustment.status})`, 'NOT_PENDING');
    }

    try {
      // Apply the adjustment based on type
      await this.applyAdjustment(adjustment, reviewerId);

      // Update adjustment status
      const updated = await prisma.adjustment.update({
        where: { id: adjustmentId },
        data: {
          status: AdjustmentStatus.APPLIED,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
          review_note: reviewNote,
          applied_at: new Date(),
          applied_by: reviewerId,
        },
      });

      // Audit log
      await auditLogService.log({
        action: 'APPROVE_ADJUSTMENT',
        entityType: 'Adjustment',
        entityId: adjustmentId,
        userId: reviewerId,
        oldData: { status: 'PENDING' },
        newData: { status: 'APPLIED', reviewNote },
      });

      // Notify requester
      await notificationService.createNotification({
        userId: adjustment.requested_by,
        type: 'ADJUSTMENT_APPROVED',
        title: 'Düzeltme Onaylandı',
        message: `${adjustment.type} düzeltme talebiniz onaylandı ve uygulandı.`,
        entityType: 'Adjustment',
        entityId: adjustmentId,
        actionUrl: '/transactions',
        actionText: 'İşlemi Gör',
        priority: 'NORMAL',
      });

      logger.info({ adjustmentId, reviewerId }, 'Adjustment approved and applied');
      return updated;
    } catch (error) {
      logger.error({ adjustmentId, error }, 'Failed to apply adjustment');
      throw error;
    }
  }

  /**
   * Reject an adjustment
   */
  async rejectAdjustment(
    adjustmentId: string,
    reviewerId: string,
    rejectionReason: string
  ) {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: adjustmentId },
    });
    if (!adjustment) throw new NotFoundError('Adjustment', adjustmentId);
    if (adjustment.status !== 'PENDING') {
      throw new BusinessError(`Düzeltme PENDING değil (mevcut: ${adjustment.status})`, 'NOT_PENDING');
    }

    const updated = await prisma.adjustment.update({
      where: { id: adjustmentId },
      data: {
        status: AdjustmentStatus.REJECTED,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_note: rejectionReason,
      },
    });

    await auditLogService.log({
      action: 'REJECT_ADJUSTMENT',
      entityType: 'Adjustment',
      entityId: adjustmentId,
      userId: reviewerId,
      oldData: { status: 'PENDING' },
      newData: { status: 'REJECTED', rejectionReason },
    });

    await notificationService.createNotification({
      userId: adjustment.requested_by,
      type: 'ADJUSTMENT_REJECTED',
      title: 'Düzeltme Reddedildi',
      message: `${adjustment.type} düzeltme talebiniz reddedildi. Sebep: ${rejectionReason}`,
      entityType: 'Adjustment',
      entityId: adjustmentId,
      actionUrl: '/transactions',
      actionText: 'İşlemi Gör',
      priority: 'HIGH',
    });

    logger.info({ adjustmentId, reviewerId, rejectionReason }, 'Adjustment rejected');
    return updated;
  }

  /**
   * Apply the adjustment — actual data modification
   */
  private async applyAdjustment(adjustment: any, appliedBy: string) {
    switch (adjustment.type) {
      case AdjustmentType.TRANSACTION_AMOUNT_CHANGE: {
        const newAmount = (adjustment.new_value as any).amount;
        await transactionService.editTransaction(
          adjustment.target_id,
          { amount: newAmount, reason: `Düzeltme #${adjustment.id}: ${adjustment.reason}` },
          appliedBy
        );
        break;
      }

      case AdjustmentType.TRANSACTION_DATE_CHANGE: {
        const newDate = (adjustment.new_value as any).date;
        await transactionService.editTransaction(
          adjustment.target_id,
          { transaction_date: newDate, reason: `Düzeltme #${adjustment.id}: ${adjustment.reason}` },
          appliedBy
        );
        break;
      }

      case AdjustmentType.TRANSACTION_DELETE: {
        await transactionService.reverseTransaction(
          adjustment.target_id,
          { reason: `Düzeltme #${adjustment.id}: ${adjustment.reason}` },
          appliedBy
        );
        break;
      }

      default:
        throw new BusinessError(`Desteklenmeyen düzeltme tipi: ${adjustment.type}`, 'UNSUPPORTED_TYPE');
    }
  }

  /**
   * Get adjustment statistics
   */
  async getStats() {
    const [pending, applied, rejected] = await Promise.all([
      prisma.adjustment.count({ where: { status: 'PENDING' } }),
      prisma.adjustment.count({ where: { status: 'APPLIED' } }),
      prisma.adjustment.count({ where: { status: 'REJECTED' } }),
    ]);
    return { pending, applied, rejected };
  }
}

export const adjustmentService = new AdjustmentService();
