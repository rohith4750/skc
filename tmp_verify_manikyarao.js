const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      name: { contains: 'Manikyarao', mode: 'insensitive' }
    }
  });
  console.log('Customers found:', JSON.stringify(customers, null, 2));

  if (customers.length > 0) {
    const cid = customers[0].id;
    const orders = await prisma.order.findMany({
      where: { customerId: cid },
      include: { items: { include: { menuItem: true } } }
    });
    console.log('Orders for customer:', JSON.stringify(orders, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
