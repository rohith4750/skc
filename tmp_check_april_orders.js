const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerIdUsedInScript = '28ba4780-93d8-4585-8fc9-083d29b4e48d';
  const customer = await prisma.customer.findUnique({ where: { id: customerIdUsedInScript } });
  console.log('Customer for 28ba...:', JSON.stringify(customer, null, 2));

  const ordersForApril = await prisma.order.findMany({
    where: {
      eventDate: {
        gte: new Date('2026-04-09'),
        lte: new Date('2026-04-13')
      }
    },
    include: { customer: true }
  });
  console.log('Orders for April 10-12:', JSON.stringify(ordersForApril, null, 2));
}

main().finally(() => prisma.$disconnect());
