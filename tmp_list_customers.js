const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true
    }
  });
  console.log(JSON.stringify(customers, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
