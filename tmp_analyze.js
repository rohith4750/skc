const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await (prisma.expense || prisma.Expense).findMany();
  const byRole = {};
  expenses.forEach(exp => {
    const role = (exp.category || 'other').toLowerCase();
    if (!byRole[role]) byRole[role] = { dues: 0, paid: 0, count: 0 };
    byRole[role].dues += Number(exp.amount || 0);
    byRole[role].paid += Number(exp.paidAmount || 0);
    byRole[role].count += 1;
  });
  console.log(JSON.stringify(byRole, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
