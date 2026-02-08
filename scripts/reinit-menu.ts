import { PrismaClient } from '@prisma/client'
import { menuItemsData } from '../data/menuItems'

const prisma = new PrismaClient()

async function reinitializeMenu() {
    console.log('\n=== Reinitializing Menu Items ===\n')

    // Check existing items
    const existingCount = await prisma.menuItem.count()
    console.log(`Current menu items in database: ${existingCount}`)

    if (existingCount > 0) {
        console.log('Menu items already exist. To reinitialize, delete them first or use a different script.')
        return
    }

    console.log(`\nAdding ${menuItemsData.length} items from data file...\n`)

    let added = 0
    for (const item of menuItemsData) {
        await prisma.menuItem.create({
            data: {
                name: item.name,
                nameTelugu: item.nameTelugu || null,
                type: item.type,
                description: item.description || null,
                descriptionTelugu: item.descriptionTelugu || null,
                isActive: true,
            }
        })
        added++
        if (added % 50 === 0) {
            console.log(`Added ${added} items...`)
        }
    }

    console.log(`\n✓ Successfully added all ${added} menu items!`)

    // Show counts by type
    const byType = await prisma.menuItem.groupBy({
        by: ['type'],
        _count: true
    })

    console.log('\nItems by type:')
    byType.forEach(group => {
        console.log(`  ${group.type}: ${group._count}`)
    })
}

reinitializeMenu()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
