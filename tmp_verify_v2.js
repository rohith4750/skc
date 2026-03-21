const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findFirst({
    where: { name: { contains: 'Manikyarao', mode: 'insensitive' } }
  });

  if (!customer) {
    console.log('Customer not found');
    return;
  }

  console.log(`Customer: ${customer.name} (${customer.id})`);

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: {
      items: {
        include: { menuItem: true }
      }
    }
  });

  orders.forEach(order => {
    console.log(`Order: ${order.id} - ${order.eventName} (${order.status})`);
    console.log(`MealTypeAmounts:`, JSON.stringify(order.mealTypeAmounts, null, 2));
    const itemsByMealType = {};
    order.items.forEach(item => {
      const mt = item.mealType || 'other';
      if (!itemsByMealType[mt]) itemsByMealType[mt] = [];
      itemsByMealType[mt].push(item.menuItem.name);
    });
    console.log(`Items grouping:`, JSON.stringify(itemsByMealType, null, 2));
    console.log('---');
  });
}

main().finally(() => prisma.$disconnect());
