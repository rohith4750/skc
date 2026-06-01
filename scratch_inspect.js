const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      customer: true
    }
  });
  
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Customer: ${o.customer?.name}, Event: ${o.eventName}, Created: ${o.createdAt}`);
    console.log('MealTypeAmounts:', JSON.stringify(o.mealTypeAmounts, null, 2));
  });
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
