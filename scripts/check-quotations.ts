import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const quotations = await prisma.order.findMany({
    where: {
      status: 'quotation' as any
    },
    include: {
      customer: true
    }
  })
  console.log('Quotations in DB:', JSON.stringify(quotations, null, 2))
  
  const allStatuses = await prisma.order.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  })
  console.log('Status Counts:', JSON.stringify(allStatuses, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
