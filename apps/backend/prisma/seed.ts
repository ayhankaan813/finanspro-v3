import { PrismaClient, UserRole, DebtStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting minimal seed (users, categories, delivery types only)...');

  // ==================== USERS ====================
  console.log('👤 Creating users...');

  const adminPassword = await hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finanspro.com' },
    update: {},
    create: {
      email: 'admin@finanspro.com',
      password_hash: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      is_active: true,
    },
  });

  console.log(`  ✅ Created ${admin.name} (Admin)`);

  // ==================== DELIVERY TYPES ====================
  console.log('📦 Creating delivery types...');

  await prisma.deliveryType.upsert({
    where: { id: 'delivery-nakit' },
    update: {},
    create: { id: 'delivery-nakit', name: 'Nakit', description: 'Elden nakit teslimat', sort_order: 1 },
  });

  await prisma.deliveryType.upsert({
    where: { id: 'delivery-papara' },
    update: {},
    create: { id: 'delivery-papara', name: 'Papara', description: 'Papara transferi', sort_order: 2 },
  });

  await prisma.deliveryType.upsert({
    where: { id: 'delivery-havale' },
    update: {},
    create: { id: 'delivery-havale', name: 'Havale', description: 'Banka havalesi', sort_order: 3 },
  });

  console.log('  ✅ Created 3 delivery types');

  // ==================== CATEGORIES ====================
  console.log('📂 Creating categories...');

  await prisma.category.upsert({
    where: { id: 'cat-giris' },
    update: {},
    create: { id: 'cat-giris', type: 'ORG_INCOME', name: 'Para Girişi', color: '#10b981' },
  });

  await prisma.category.upsert({
    where: { id: 'cat-cikis' },
    update: {},
    create: { id: 'cat-cikis', type: 'ORG_EXPENSE', name: 'Para Çıkışı', color: '#ef4444' },
  });

  await prisma.category.upsert({
    where: { id: 'cat-komisyon' },
    update: {},
    create: { id: 'cat-komisyon', type: 'ORG_INCOME', name: 'Komisyon', color: '#f59e0b' },
  });

  await prisma.category.upsert({
    where: { id: 'cat-odeme' },
    update: {},
    create: { id: 'cat-odeme', type: 'PAYMENT', name: 'Ödeme', color: '#8b5cf6' },
  });

  await prisma.category.upsert({
    where: { id: 'cat-teslimat' },
    update: {},
    create: { id: 'cat-teslimat', type: 'PAYMENT', name: 'Teslimat', color: '#06b6d4' },
  });

  await prisma.category.upsert({
    where: { id: 'cat-takviye' },
    update: {},
    create: { id: 'cat-takviye', type: 'ORG_INCOME', name: 'Takviye', color: '#3b82f6' },
  });

  console.log('  ✅ Created 6 categories');

  // ==================== TEST FINANCIERS (for debt seed) ====================
  console.log('💰 Creating test financiers for debt data...');

  const financier1 = await prisma.financier.upsert({
    where: { code: 'YAGIZ' },
    update: {},
    create: {
      id: 'fin-yagiz',
      name: 'Yağız',
      code: 'YAGIZ',
      description: 'Test finansör - Yağız',
      is_active: true,
    },
  });

  const financier2 = await prisma.financier.upsert({
    where: { code: 'TOPRAK' },
    update: {},
    create: {
      id: 'fin-toprak',
      name: 'Toprak',
      code: 'TOPRAK',
      description: 'Test finansör - Toprak',
      is_active: true,
    },
  });

  const financier3 = await prisma.financier.upsert({
    where: { code: 'DENIZ' },
    update: {},
    create: {
      id: 'fin-deniz',
      name: 'Deniz',
      code: 'DENIZ',
      description: 'Test finansör - Deniz',
      is_active: true,
    },
  });

  console.log('  ✅ Created 3 test financiers');

  // ==================== TEST DEBTS ====================
  console.log('📋 Creating test debts...');

  // Debt 1: Yağız borrowed 10,000 from Toprak — partially paid (3,000 paid, 7,000 remaining)
  const debt1 = await prisma.debt.upsert({
    where: { id: 'debt-001' },
    update: {},
    create: {
      id: 'debt-001',
      lender_id: financier2.id,
      borrower_id: financier1.id,
      amount: 10000,
      remaining_amount: 7000,
      status: DebtStatus.ACTIVE,
      description: 'Yağız kasası için nakit takviye',
      created_by: admin.id,
    },
  });

  // Debt 2: Deniz borrowed 5,000 from Yağız — fully open (no payments)
  const debt2 = await prisma.debt.upsert({
    where: { id: 'debt-002' },
    update: {},
    create: {
      id: 'debt-002',
      lender_id: financier1.id,
      borrower_id: financier3.id,
      amount: 5000,
      remaining_amount: 5000,
      status: DebtStatus.ACTIVE,
      description: 'Deniz kasası acil nakit ihtiyacı',
      created_by: admin.id,
    },
  });

  // Debt 3: Toprak borrowed 2,000 from Deniz — fully paid
  const debt3 = await prisma.debt.upsert({
    where: { id: 'debt-003' },
    update: {},
    create: {
      id: 'debt-003',
      lender_id: financier3.id,
      borrower_id: financier2.id,
      amount: 2000,
      remaining_amount: 0,
      status: DebtStatus.PAID,
      description: 'Kısa vadeli nakit ihtiyacı',
      created_by: admin.id,
    },
  });

  console.log('  ✅ Created 3 test debts');

  // ==================== TEST DEBT PAYMENTS ====================
  console.log('💸 Creating test debt payments...');

  // Payment for Debt 1: Yağız paid 3,000 to Toprak (partial)
  await prisma.debtPayment.upsert({
    where: { id: 'dpay-001' },
    update: {},
    create: {
      id: 'dpay-001',
      debt_id: debt1.id,
      amount: 3000,
      description: 'İlk kısmi ödeme',
      created_by: admin.id,
    },
  });

  // Payments for Debt 3: Toprak paid 2,000 to Deniz (full, in two payments)
  await prisma.debtPayment.upsert({
    where: { id: 'dpay-002' },
    update: {},
    create: {
      id: 'dpay-002',
      debt_id: debt3.id,
      amount: 1500,
      description: 'Birinci ödeme',
      created_by: admin.id,
    },
  });

  await prisma.debtPayment.upsert({
    where: { id: 'dpay-003' },
    update: {},
    create: {
      id: 'dpay-003',
      debt_id: debt3.id,
      amount: 500,
      description: 'Son ödeme - borç kapandı',
      created_by: admin.id,
    },
  });

  console.log('  ✅ Created 3 test debt payments');

  console.log('');
  console.log('✅ Seed completed!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('  Email: admin@finanspro.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('📊 Test Data Summary:');
  console.log('  Financiers: 3 (Yağız, Toprak, Deniz)');
  console.log('  Debts: 3 (1 active partial, 1 active open, 1 paid)');
  console.log('  Debt Payments: 3');

  // Suppress unused variable warnings
  void debt2;
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
