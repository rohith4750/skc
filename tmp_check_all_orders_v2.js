const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerId = '28ba4780-93d8-4585-8fc9-083d29b4e48d';
  
  const orders = await prisma.order.findMany({
    where: {
      customerId: customerId
    },
    include: {
      items: {
        include: {
          menuItem: true
        }
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
