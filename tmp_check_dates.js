const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerId = '14e0586e-8260-4497-b6f7-497745778a48';
  const dates = ['2026-04-10', '2026-04-11', '2026-04-12'];
  
  const orders = await prisma.order.findMany({
    where: {
      customerId: customerId,
      eventDate: {
        in: dates.map(d => new Date(d))
      }
    }
  });

  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
