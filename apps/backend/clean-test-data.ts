import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning test data...');

  // Delete in correct order
  await prisma.ledgerEntry.deleteMany({});
  console.log('✅ Deleted all ledger entries');

  await prisma.transaction.deleteMany({});
  console.log('✅ Deleted all transactions');

  await prisma.financierBlock.deleteMany({});
  console.log('✅ Deleted all financier blocks');

  await prisma.commissionRate.deleteMany({});
  console.log('✅ Deleted all commission rates');

  await prisma.sitePartner.deleteMany({});
  console.log('✅ Deleted all site-partner relationships');

  await prisma.account.deleteMany({});
  console.log('✅ Deleted all accounts');

  await prisma.externalParty.deleteMany({});
  console.log('✅ Deleted all external parties');

  await prisma.financier.deleteMany({});
  console.log('✅ Deleted all financiers');

  await prisma.partner.deleteMany({});
  console.log('✅ Deleted all partners');

  await prisma.site.deleteMany({});
  console.log('✅ Deleted all sites');

  console.log('');
  console.log('✅ Database cleaned! Ready for fresh test.');
}

main()
  .catch((e) => {
    console.error('❌ Clean error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
