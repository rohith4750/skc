const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      name: {
        contains: 'Manikyarao',
        mode: 'insensitive'
      }
    },
    include: {
      orders: {
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        }
      }
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
