import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      customer: true
    }
  })
  
  console.log('Recent Orders:')
  recentOrders.forEach(o => {
    console.log(`- ID: ${o.id}, Status: ${o.status}, CreatedAt: ${o.createdAt}, Customer: ${o.customer?.name}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
