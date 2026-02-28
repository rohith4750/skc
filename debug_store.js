const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await (prisma.expense || prisma.Expense).findMany({
    where: { category: { equals: 'store', mode: 'insensitive' } }
  });
  
  console.log('--- Store Expenses ---');
  expenses.forEach(exp => {
    const outstanding = Number(exp.amount || 0) - Number(exp.paidAmount || 0);
    console.log(`ID: ${exp.id}, Amount: ${exp.amount}, Paid: ${exp.paidAmount}, Outstanding: ${outstanding}, Description: ${exp.description}`);
  });

  const payments = await (prisma.workforcePayment || prisma.WorkforcePayment).findMany({
    where: { role: { equals: 'store', mode: 'insensitive' } }
  });
  console.log('--- Store Workforce Payments ---');
  payments.forEach(p => {
    console.log(`ID: ${p.id}, Amount: ${p.amount}, Date: ${p.paymentDate}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
