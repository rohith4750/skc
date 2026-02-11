import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
prisma.menuItem.count().then(count => {
    console.log(`Menu items in database: ${count}`)
    prisma.$disconnect()
})
