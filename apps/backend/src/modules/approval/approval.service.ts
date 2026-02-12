import prisma from '../../shared/prisma/client.js';
import { logger } from '../../shared/utils/logger.js';
import { notificationService } from '../notification/notification.service.js';
import { auditLogService } from '../../shared/audit-log.js';
import { commissionService } from '../transaction/commission.service.js';
import { ledgerService } from '../ledger/ledger.service.js';
import type { Transaction, TransactionStatus, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

export class ApprovalService {
  /**
   * Check if transaction requires approval based on CEO's rules:
   * - DEPOSIT and WITHDRAWAL: NO approval needed
   * - All other types: YES approval needed
   * - ADMIN role: NO approval needed (can do everything)
   */
  requiresApproval(type: TransactionType, userRole: string): boolean {
    // ADMIN can do everything without approval
    if (userRole === 'ADMIN') {
      return false;
    }

    // DEPOSIT and WITHDRAWAL don't require approval
    if (type === 'DEPOSIT' || type === 'WITHDRAWAL') {
      return false;
    }

    // Everything else requires approval
    return true;
  }

  /**
   * Get all pending transactions (waiting for approval)
   */
  async getPendingTransactions() {
    return prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        deleted_at: null,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        financier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        external_party: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Approve a pending transaction
   * This will create ledger entries and update balances
   */
  async approveTransaction(transactionId: string, reviewerId: string, reviewNote?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        site: true,
        partner: true,
        financier: true,
        external_party: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error(`Transaction is not pending (current status: ${transaction.status})`);
    }

    try {
      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update transaction status to COMPLETED
        const updatedTransaction = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
          },
        });

        // 2. Create commission snapshot and ledger entries
        // This is the critical part - now we actually process the transaction
        if (transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAWAL') {
          // Create commission snapshot
          await commissionService.createCommissionSnapshot(updatedTransaction as any, tx);

          // Create ledger entries
          await ledgerService.createTransactionLedgerEntries(updatedTransaction as any, tx);
        } else {
          // For other transaction types, create appropriate ledger entries
          await ledgerService.createTransactionLedgerEntries(updatedTransaction as any, tx);
        }

        return updatedTransaction;
      });

      // 3. Log the approval in audit log
      await auditLogService.log({
        action: 'APPROVE_TRANSACTION',
        entityType: 'Transaction',
        entityId: transactionId,
        userId: reviewerId,
        oldData: { status: 'PENDING' },
        newData: { status: 'COMPLETED', reviewNote },
      });

      // 4. Notify the requester that their transaction was approved
      const requester = await prisma.user.findUnique({
        where: { id: transaction.created_by },
      });

      if (requester) {
        await notificationService.createNotification({
          userId: requester.id,
          type: 'TRANSACTION_APPROVED',
          title: 'İşlem Onaylandı',
          message: `${transaction.type} işleminiz onaylandı. Tutar: ${transaction.gross_amount} TL`,
          entityType: 'Transaction',
          entityId: transactionId,
          actionUrl: `/transactions/${transactionId}`,
          actionText: 'İşlemi Gör',
          priority: 'NORMAL',
        });
      }

      logger.info('Transaction approved', { transactionId, reviewerId });

      return result;
    } catch (error) {
      logger.error('Failed to approve transaction', { transactionId, error });
      throw error;
    }
  }

  /**
   * Reject a pending transaction
   */
  async rejectTransaction(transactionId: string, reviewerId: string, rejectionReason: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error(`Transaction is not pending (current status: ${transaction.status})`);
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    try {
      // Update transaction status to FAILED (rejected)
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          reversal_reason: rejectionReason,
        },
      });

      // Log the rejection
      await auditLogService.log({
        action: 'REJECT_TRANSACTION',
        entityType: 'Transaction',
        entityId: transactionId,
        userId: reviewerId,
        oldData: { status: 'PENDING' },
        newData: { status: 'FAILED', rejectionReason },
      });

      // Notify the requester that their transaction was rejected
      const requester = await prisma.user.findUnique({
        where: { id: transaction.created_by },
      });

      if (requester) {
        await notificationService.createNotification({
          userId: requester.id,
          type: 'TRANSACTION_REJECTED',
          title: 'İşlem Reddedildi',
          message: `${transaction.type} işleminiz reddedildi. Sebep: ${rejectionReason}`,
          entityType: 'Transaction',
          entityId: transactionId,
          actionUrl: `/transactions/${transactionId}`,
          actionText: 'İşlemi Gör',
          priority: 'HIGH',
        });
      }

      logger.info('Transaction rejected', { transactionId, reviewerId, rejectionReason });

      return updatedTransaction;
    } catch (error) {
      logger.error('Failed to reject transaction', { transactionId, error });
      throw error;
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats() {
    const [pending, approvedToday, rejectedToday] = await Promise.all([
      prisma.transaction.count({
        where: {
          status: 'PENDING',
          deleted_at: null,
        },
      }),
      prisma.transaction.count({
        where: {
          status: 'COMPLETED',
          created_at: {
            lt: new Date(), // Was created earlier
          },
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Updated today (approved)
          },
        },
      }),
      prisma.transaction.count({
        where: {
          status: 'FAILED',
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Updated today (rejected)
          },
        },
      }),
    ]);

    return {
      pending,
      approvedToday,
      rejectedToday,
    };
  }
}

export const approvalService = new ApprovalService();
