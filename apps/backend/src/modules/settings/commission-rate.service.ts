import { Prisma, EntityType, TransactionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError, ConflictError, BusinessError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type {
  CreateCommissionRateInput,
  UpdateCommissionRateInput,
  CommissionRateQueryInput,
} from './commission-rate.schema.js';

export class CommissionRateService {
  /**
   * Create a new commission rate
   */
  async create(input: CreateCommissionRateInput, createdBy: string) {
    // Validate entity exists
    await this.validateEntityExists(input.entity_type, input.entity_id);

    // If partner, validate related site exists
    if (input.entity_type === EntityType.PARTNER && input.related_site_id) {
      const site = await prisma.site.findUnique({
        where: { id: input.related_site_id, deleted_at: null },
      });
      if (!site) {
        throw new NotFoundError('Site', input.related_site_id);
      }
    }

    // Check for duplicate active rate
    const existingRate = await prisma.commissionRate.findFirst({
      where: {
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        transaction_type: input.transaction_type,
        related_site_id: input.related_site_id || null,
        is_active: true,
        OR: [
          { effective_until: null },
          { effective_until: { gt: new Date() } },
        ],
      },
    });

    if (existingRate) {
      throw new ConflictError(
        'Bu entity ve işlem tipi için aktif bir komisyon oranı zaten var. Önce mevcut oranı devre dışı bırakın.'
      );
    }

    const rate = await prisma.$transaction(async (tx) => {
      const newRate = await tx.commissionRate.create({
        data: {
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          transaction_type: input.transaction_type,
          related_site_id: input.related_site_id || null,
          rate: new Decimal(input.rate),
          effective_from: input.effective_from ? new Date(input.effective_from) : new Date(),
          effective_until: input.effective_until ? new Date(input.effective_until) : null,
          is_active: true,
          // Set the appropriate FK based on entity type
          site_id: input.entity_type === EntityType.SITE ? input.entity_id : null,
          partner_id: input.entity_type === EntityType.PARTNER ? input.entity_id : null,
          financier_id: input.entity_type === EntityType.FINANCIER ? input.entity_id : null,
        },
      });

      // CRITICAL FIX: If partner is being assigned to a site, create site_partner relationship
      if (input.entity_type === EntityType.PARTNER && input.related_site_id) {
        // Check if relationship already exists
        const existingSitePartner = await tx.sitePartner.findFirst({
          where: {
            site_id: input.related_site_id,
            partner_id: input.entity_id,
            deleted_at: null,
          },
        });

        // Only create if doesn't exist
        if (!existingSitePartner) {
          await tx.sitePartner.create({
            data: {
              site_id: input.related_site_id,
              partner_id: input.entity_id,
              is_active: true,
              effective_from: new Date(),
              effective_until: null,
            },
          });

          logger.info(
            {
              partnerId: input.entity_id,
              siteId: input.related_site_id,
            },
            'Partner automatically assigned to site via commission rate creation'
          );
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'CommissionRate',
          entity_id: newRate.id,
          new_data: {
            ...newRate,
            rate: newRate.rate.toString(),
          } as unknown as Prisma.JsonObject,
          user_id: createdBy,
          user_email: '',
        },
      });

      return newRate;
    });

    logger.info(
      { rateId: rate.id, entityType: input.entity_type, transactionType: input.transaction_type },
      'Commission rate created'
    );

    return rate;
  }

  /**
   * Find commission rate by ID
   */
  async findById(id: string) {
    const rate = await prisma.commissionRate.findUnique({
      where: { id },
    });

    if (!rate) {
      throw new NotFoundError('CommissionRate', id);
    }

    return rate;
  }

  /**
   * List commission rates with filtering
   */
  async findAll(query: CommissionRateQueryInput) {
    const where: Prisma.CommissionRateWhereInput = {};

    if (query.entity_type) {
      where.entity_type = query.entity_type;
    }

    if (query.entity_id) {
      where.entity_id = query.entity_id;
    }

    if (query.transaction_type) {
      where.transaction_type = query.transaction_type;
    }

    if (query.is_active !== undefined) {
      where.is_active = query.is_active === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.commissionRate.findMany({
        where,
        orderBy: [{ entity_type: 'asc' }, { transaction_type: 'asc' }, { created_at: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.commissionRate.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Update commission rate
   * CFO LOGIC: When rate changes, we close the old record and create a new one
   * This preserves historical accuracy for past transactions
   */
  async update(id: string, input: UpdateCommissionRateInput, updatedBy: string) {
    const existing = await this.findById(id);

    const rate = await prisma.$transaction(async (tx) => {
      // If only toggling is_active or effective_until, just update
      if (!input.rate && (input.is_active !== undefined || input.effective_until)) {
        const updated = await tx.commissionRate.update({
          where: { id },
          data: {
            effective_until: input.effective_until ? new Date(input.effective_until) : undefined,
            is_active: input.is_active,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'UPDATE',
            entity_type: 'CommissionRate',
            entity_id: id,
            old_data: {
              ...existing,
              rate: existing.rate.toString(),
            } as unknown as Prisma.JsonObject,
            new_data: {
              ...updated,
              rate: updated.rate.toString(),
            } as unknown as Prisma.JsonObject,
            user_id: updatedBy,
            user_email: '',
          },
        });

        return updated;
      }

      // IF RATE IS CHANGING: Close old record, create new one (CFO approach)
      if (input.rate) {
        const now = new Date();

        // Step 1: Close the old rate (set effective_until to now)
        await tx.commissionRate.update({
          where: { id },
          data: {
            effective_until: now,
            is_active: false, // Close it
          },
        });

        // Step 2: Create new rate with new value
        const newRate = await tx.commissionRate.create({
          data: {
            entity_type: existing.entity_type,
            entity_id: existing.entity_id,
            transaction_type: existing.transaction_type,
            related_site_id: existing.related_site_id,
            rate: new Decimal(input.rate),
            effective_from: now,
            effective_until: null, // Open-ended
            is_active: true,
            // Set the appropriate FK based on entity type
            site_id: existing.site_id,
            partner_id: existing.partner_id,
            financier_id: existing.financier_id,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'COMMISSION_RATE_CHANGE',
            entity_type: 'CommissionRate',
            entity_id: newRate.id,
            old_data: {
              ...existing,
              rate: existing.rate.toString(),
            } as unknown as Prisma.JsonObject,
            new_data: {
              ...newRate,
              rate: newRate.rate.toString(),
            } as unknown as Prisma.JsonObject,
            user_id: updatedBy,
            user_email: '',
          },
        });

        logger.info(
          {
            oldRateId: id,
            newRateId: newRate.id,
            oldRate: existing.rate.toString(),
            newRate: newRate.rate.toString(),
          },
          'Commission rate changed - old record closed, new record created'
        );

        return newRate;
      }

      // Fallback (should not reach here)
      return existing;
    });

    return rate;
  }

  /**
   * Get effective commission rate for an entity and transaction type
   */
  async getEffectiveRate(
    entityType: EntityType,
    entityId: string,
    transactionType: TransactionType,
    relatedSiteId?: string
  ): Promise<Decimal> {
    const now = new Date();

    const rate = await prisma.commissionRate.findFirst({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        transaction_type: transactionType,
        related_site_id: relatedSiteId || null,
        is_active: true,
        effective_from: { lte: now },
        OR: [
          { effective_until: null },
          { effective_until: { gt: now } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });

    if (!rate) {
      return new Decimal(0);
    }

    return rate.rate;
  }

  /**
   * Get all effective rates for an entity
   */
  async getEntityRates(entityType: EntityType, entityId: string) {
    const now = new Date();

    const rates = await prisma.commissionRate.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        is_active: true,
        effective_from: { lte: now },
        OR: [
          { effective_until: null },
          { effective_until: { gt: now } },
        ],
      },
      orderBy: { transaction_type: 'asc' },
    });

    return rates;
  }

  /**
   * Validate entity exists
   */
  private async validateEntityExists(entityType: EntityType, entityId: string) {
    let exists = false;

    switch (entityType) {
      case EntityType.SITE:
        exists = !!(await prisma.site.findUnique({ where: { id: entityId, deleted_at: null } }));
        break;
      case EntityType.PARTNER:
        exists = !!(await prisma.partner.findUnique({ where: { id: entityId, deleted_at: null } }));
        break;
      case EntityType.FINANCIER:
        exists = !!(await prisma.financier.findUnique({ where: { id: entityId, deleted_at: null } }));
        break;
      default:
        throw new BusinessError(`Invalid entity type: ${entityType}`, 'INVALID_ENTITY_TYPE');
    }

    if (!exists) {
      throw new NotFoundError(entityType, entityId);
    }
  }
}

export const commissionRateService = new CommissionRateService();
