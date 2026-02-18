import { Decimal } from 'decimal.js';
import prisma from '../../shared/prisma/client.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import { logger } from '../../shared/utils/logger.js';
import type {
  CreatePersonnelInput,
  UpdatePersonnelInput,
  AddPaymentInput,
} from './personnel.schema.js';

export class PersonnelService {
  /**
   * List all active personnel with payment summaries
   */
  async list() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const personnelList = await prisma.personnel.findMany({
      where: { deleted_at: null },
      include: {
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return personnelList.map((p) => {
      let totalPaid = new Decimal(0);
      let paidThisMonth = new Decimal(0);

      for (const payment of p.payments) {
        totalPaid = totalPaid.plus(payment.amount);
        if (payment.period_month === currentMonth && payment.period_year === currentYear) {
          paidThisMonth = paidThisMonth.plus(payment.amount);
        }
      }

      // Calculate months employed
      const startDate = new Date(p.start_date);
      const monthsEmployed =
        (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth());

      return {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        role: p.role,
        monthly_salary: new Decimal(p.monthly_salary).toFixed(2),
        start_date: p.start_date,
        status: p.status,
        notes: p.notes,
        created_at: p.created_at,
        updated_at: p.updated_at,
        total_paid: totalPaid.toFixed(2),
        paid_this_month: paidThisMonth.toFixed(2),
        months_employed: Math.max(monthsEmployed, 0),
      };
    });
  }

  /**
   * Get single personnel by ID with payment summary
   */
  async getById(id: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const personnel = await prisma.personnel.findUnique({
      where: { id, deleted_at: null },
      include: {
        payments: true,
      },
    });

    if (!personnel) {
      throw new NotFoundError('Personnel', id);
    }

    let totalPaid = new Decimal(0);
    let paidThisMonth = new Decimal(0);

    for (const payment of personnel.payments) {
      totalPaid = totalPaid.plus(payment.amount);
      if (payment.period_month === currentMonth && payment.period_year === currentYear) {
        paidThisMonth = paidThisMonth.plus(payment.amount);
      }
    }

    const startDate = new Date(personnel.start_date);
    const monthsEmployed =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());

    return {
      id: personnel.id,
      first_name: personnel.first_name,
      last_name: personnel.last_name,
      phone: personnel.phone,
      role: personnel.role,
      monthly_salary: new Decimal(personnel.monthly_salary).toFixed(2),
      start_date: personnel.start_date,
      status: personnel.status,
      notes: personnel.notes,
      created_at: personnel.created_at,
      updated_at: personnel.updated_at,
      total_paid: totalPaid.toFixed(2),
      paid_this_month: paidThisMonth.toFixed(2),
      months_employed: Math.max(monthsEmployed, 0),
    };
  }

  /**
   * Create new personnel
   */
  async create(input: CreatePersonnelInput) {
    const personnel = await prisma.personnel.create({
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        role: input.role,
        monthly_salary: new Decimal(input.monthly_salary),
        start_date: new Date(input.start_date),
        notes: input.notes,
      },
    });

    logger.info({ personnelId: personnel.id }, 'Personnel created');

    return this.getById(personnel.id);
  }

  /**
   * Update personnel
   */
  async update(id: string, input: UpdatePersonnelInput) {
    await this.getById(id); // verify exists

    const updateData: Record<string, unknown> = {};
    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.monthly_salary !== undefined) updateData.monthly_salary = new Decimal(input.monthly_salary);
    if (input.start_date !== undefined) updateData.start_date = new Date(input.start_date);
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;

    await prisma.personnel.update({
      where: { id },
      data: updateData,
    });

    logger.info({ personnelId: id }, 'Personnel updated');

    return this.getById(id);
  }

  /**
   * Soft delete personnel
   */
  async softDelete(id: string) {
    await this.getById(id); // verify exists

    await prisma.personnel.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    logger.info({ personnelId: id }, 'Personnel soft deleted');
  }

  /**
   * Get paginated payment history for a personnel
   */
  async getPayments(personnelId: string, page: number, limit: number) {
    await this.getById(personnelId); // verify exists

    const where = { personnel_id: personnelId };

    const [items, total] = await Promise.all([
      prisma.personnelPayment.findMany({
        where,
        orderBy: { payment_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.personnelPayment.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        amount: new Decimal(item.amount).toFixed(2),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Record a payment for personnel
   */
  async addPayment(personnelId: string, input: AddPaymentInput) {
    await this.getById(personnelId); // verify exists

    const payment = await prisma.personnelPayment.create({
      data: {
        personnel_id: personnelId,
        amount: new Decimal(input.amount),
        payment_type: input.payment_type,
        payment_date: new Date(input.payment_date),
        period_month: input.period_month,
        period_year: input.period_year,
        description: input.description,
      },
    });

    logger.info({ personnelId, paymentId: payment.id }, 'Personnel payment recorded');

    return {
      ...payment,
      amount: new Decimal(payment.amount).toFixed(2),
    };
  }

  /**
   * Get summary statistics
   */
  async getSummary() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const activePersonnel = await prisma.personnel.findMany({
      where: { deleted_at: null, status: 'ACTIVE' },
      include: {
        payments: {
          where: {
            period_month: currentMonth,
            period_year: currentYear,
          },
        },
      },
    });

    let totalSalaryObligation = new Decimal(0);
    let totalPaidThisMonth = new Decimal(0);
    let totalAdvances = new Decimal(0);

    for (const p of activePersonnel) {
      totalSalaryObligation = totalSalaryObligation.plus(p.monthly_salary);

      for (const payment of p.payments) {
        totalPaidThisMonth = totalPaidThisMonth.plus(payment.amount);
        if (payment.payment_type === 'ADVANCE') {
          totalAdvances = totalAdvances.plus(payment.amount);
        }
      }
    }

    return {
      totalPersonnel: activePersonnel.length,
      totalSalaryObligation: totalSalaryObligation.toFixed(2),
      totalPaidThisMonth: totalPaidThisMonth.toFixed(2),
      totalAdvances: totalAdvances.toFixed(2),
    };
  }
}

export const personnelService = new PersonnelService();
