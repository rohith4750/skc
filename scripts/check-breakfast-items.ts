import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMenuItems() {
    console.log('\n=== Checking menu item types for common breakfast items ===\n')

    const breakfastItems = ['Idli', 'Wada', 'Sambar', 'Chutney', 'Karam Podi', 'Ghee']

    for (const itemName of breakfastItems) {
        const items = await prisma.menuItem.findMany({
            where: {
                name: {
                    contains: itemName,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                type: true,
                isActive: true
            }
        })

        console.log(`${itemName}:`)
        items.forEach(item => {
            console.log(`  - Type: ${item.type}, Active: ${item.isActive}, ID: ${item.id.substring(0, 8)}...`)
        })
        console.log()
    }
}

checkMenuItems()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
