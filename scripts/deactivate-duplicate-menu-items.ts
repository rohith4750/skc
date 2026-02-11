import { PrismaClient } from '@prisma/client'
import { menuItemsData } from '../data/menuItems'

const prisma = new PrismaClient()

async function deactivateDuplicates() {
    console.log('Finding and deactivating duplicate breakfast items...')

    // Get all menu items
    const allItems = await prisma.menuItem.findMany()

    // Create a map from data file
    const dataFileMap = new Map(
        menuItemsData.map(item => [item.name.toLowerCase(), item])
    )

    // Group by name (case-insensitive)
    const itemsByName = new Map<string, any[]>()

    for (const item of allItems) {
        const name = item.name.toLowerCase()
        if (!itemsByName.has(name)) {
            itemsByName.set(name, [])
        }
        const existing = itemsByName.get(name)!
        existing.push(item)
    }

    let deactivated = 0

    // For duplicates,keep active only the one that matches data file type
    for (const [name, items] of Array.from(itemsByName.entries())) {
        if (items.length > 1) {
            const dataItem = dataFileMap.get(name)

            console.log(`\nFound ${items.length} items named "${items[0].name}":`)

            for (const item of items) {
                const shouldBeActive = dataItem && item.type === dataItem.type
                console.log(`  Type: ${item.type}, Active: ${item.isActive} → ${shouldBeActive ? 'KEEP ACTIVE' : 'DEACTIVATE'}`)

                if (!shouldBeActive && item.isActive) {
                    await prisma.menuItem.update({
                        where: { id: item.id },
                        data: { isActive: false }
                    })
                    deactivated++
                }
            }
        }
    }

    console.log(`\n✓ Deactivated ${deactivated} duplicate items`)

    // Show counts
    const total = await prisma.menuItem.count()
    const active = await prisma.menuItem.count({ where: { isActive: true } })
    console.log(`✓ Total: ${total}, Active: ${active}, Inactive: ${total - active}`)
}

deactivateDuplicates()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
