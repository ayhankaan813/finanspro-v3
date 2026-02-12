// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // Current month

  // Find a valid Site to attach transactions to
  const site = await prisma.site.findFirst();
  if (!site) {
    console.log("No site found. Creating a dummy site...");
    try {
      await prisma.site.create({
        data: {
          name: 'Demo Casino',
          code: 'DEMO',
          is_active: true
        }
      });
    } catch (e) {
      console.log("Site creation failed or already exists (race condition)", e.message);
    }
  }
  
  const targetSite = await prisma.site.findFirst();
  if (!targetSite) {
      console.log("Still no site found. Aborting.");
      return;
  }
  const siteId = targetSite.id;

  console.log(`Seeding data for Site: ${targetSite.name} (${siteId}) in Month: ${month + 1}/${year}`);

  // Create transactions for various days in the month
  const transactions = [
    { day: 1, type: 'DEPOSIT', amount: 50000, description: 'Initial Deposit' },
    { day: 2, type: 'WITHDRAWAL', amount: 10000, description: 'Client Withdrawal' },
    { day: 5, type: 'DEPOSIT', amount: 75000, description: 'Large Deposit' },
    { day: 5, type: 'DEPOSIT', amount: 25000, description: 'Another Deposit' },
    { day: 8, type: 'WITHDRAWAL', amount: 30000, description: 'Payout' },
    { day: 12, type: 'DEPOSIT', amount: 100000, description: 'Big Win Deposit' },
    { day: 15, type: 'WITHDRAWAL', amount: 50000, description: 'Mid-month Payout' },
    { day: 20, type: 'DEPOSIT', amount: 60000, description: 'Late Deposit' },
    { day: 25, type: 'WITHDRAWAL', amount: 20000, description: 'End month withdrawal' },
  ];

  for (const tx of transactions) {
     // Create date in UTC to match how apps usually handle it, or local. 
     // Using noon to avoid timezone edge cases shifting the day.
    const date = new Date(year, month, tx.day, 12, 0, 0); 
    
    await prisma.transaction.create({
      data: {
        site_id: siteId,
        gross_amount: tx.amount,
        net_amount: tx.amount, // Assuming 0 comm for simplicity or same
        type: tx.type, 
        status: 'COMPLETED',
        description: tx.description,
        transaction_date: date,
        created_at: date,
        updated_at: date,
        created_by: 'system_seed' // Required field
      }
    });
    console.log(`Created ${tx.type} of ${tx.amount} on ${date.toISOString()}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
