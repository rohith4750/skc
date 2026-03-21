const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerId = '97c58ea4-8b14-4602-b549-c958d8ced537';
  const orders = await prisma.order.findMany({
    where: { customerId, eventName: { contains: 'Kesariii' } },
    include: { items: { include: { menuItem: true } } }
  });

  console.log(`Found ${orders.length} Kesariii orders.`);
  orders.forEach(o => {
    console.log(`Order: ${o.eventName} (${o.eventDate.toISOString()})`);
    const sessions = Object.keys(o.mealTypeAmounts || {});
    console.log(`  Sessions: ${sessions.length}`);
    const itemsBySession = {};
    o.items.forEach(it => {
      if (!itemsBySession[it.mealType]) itemsBySession[it.mealType] = [];
      itemsBySession[it.mealType].push(it.menuItem.name);
    });
    sessions.forEach(sid => {
      const s = o.mealTypeAmounts[sid];
      const items = itemsBySession[sid] || [];
      console.log(`    Session ${s.menuType}: ${items.length} items`);
    });
  });
}

main().finally(() => prisma.$disconnect());
