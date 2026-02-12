import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@finanspro.com' },
    include: { organization: true }
  });
  
  if (user) {
    console.log(`User Org ID: ${user.organization_id}`);
    if (user.organization) {
        console.log(`User Org Name: ${user.organization.name}`);
    }
  } else {
    console.log("User not found");
  }

  const allOrgs = await prisma.organization.findMany();
  console.log("All Organizations:", allOrgs.map(o => ({ id: o.id, name: o.name })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.();
  });
