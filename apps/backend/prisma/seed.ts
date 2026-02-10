import { PrismaClient, UserRole } from '@prisma/client';
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

  console.log('');
  console.log('✅ Minimal seed completed!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('  Email: admin@finanspro.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('💡 No test data created - database is clean and ready for real data');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
