const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customerId = '97c58ea4-8b14-4602-b549-c958d8ced537';
  const orders = await prisma.order.findMany({
    where: { customerId, eventName: { contains: 'Kesariii' } },
    include: { items: { include: { menuItem: true } } }
  });

  console.log(`Found ${orders.length} Kesariii order(s).`);
  orders.forEach(o => {
    console.log(`Order ID: ${o.id}`);
    console.log(`Event Name: ${o.eventName}`);
    const sessions = Object.keys(o.mealTypeAmounts || {});
    console.log(`Total Sessions: ${sessions.length}`);
    
    // Group items by session
    const itemsBySession = {};
    o.items.forEach(it => {
      if (!itemsBySession[it.mealType]) itemsBySession[it.mealType] = [];
      itemsBySession[it.mealType].push(it.menuItem.name);
    });

    // Sort sessions by date
    const sortedSessionIds = sessions.sort((a,b) => {
        return new Date(o.mealTypeAmounts[a].date) - new Date(o.mealTypeAmounts[b].date);
    });

    sortedSessionIds.forEach(sid => {
      const s = o.mealTypeAmounts[sid];
      const items = itemsBySession[sid] || [];
      console.log(`  [${s.date}] ${s.menuType}: ${items.length} items`);
    });
  });
}

main().finally(() => prisma.$disconnect());
