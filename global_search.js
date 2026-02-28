const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = ['order', 'bill', 'expense', 'workforcePayment', 'stock', 'stockTransaction'];
  
  for (const model of models) {
    try {
      const records = await prisma[model].findMany();
      records.forEach(r => {
        for (const key in r) {
          const val = r[key];
          if (val && (Number(val) === 4000 || Number(val) === 214630 || Number(val) === 210630)) {
            console.log(`MATCH in model ${model}, record ID ${r.id || 'N/A'}: ${key} = ${val}`);
          }
        }
      });
    } catch (e) {
      // Skip models that might not exist or have issues
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
