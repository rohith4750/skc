const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const menuItems = await prisma.menuItem.findMany();
  console.log(JSON.stringify(menuItems, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
