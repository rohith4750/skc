import { PrismaClient } from '@prisma/client'
import { menuItemsData } from '../data/menuItems'

const prisma = new PrismaClient()

async function cleanupMenuItems() {
    console.log('Starting menu items cleanup...')

    // Get all menu items from database
    const dbItems = await prisma.menuItem.findMany()
    console.log(`Found ${dbItems.length} items in database`)

    // Create a map of items from the data file by name
    const dataFileMap = new Map(
        menuItemsData.map(item => [item.name.toLowerCase(), item])
    )

    let updated = 0
    let deleted = 0

    // Update each database item to match the data file
    for (const dbItem of dbItems) {
        const dataItem = dataFileMap.get(dbItem.name.toLowerCase())

        if (!dataItem) {
            console.log(`Item "${dbItem.name}" exists in DB but not in data file - keeping as is`)
            continue
        }

        // Check if type needs to be updated
        if (dbItem.type !== dataItem.type) {
            console.log(`Updating "${dbItem.name}": ${dbItem.type} -> ${dataItem.type}`)
            await prisma.menuItem.update({
                where: { id: dbItem.id },
                data: {
                    type: dataItem.type,
                    description: dataItem.description
                }
            })
            updated++
        }
    }

    // Check for duplicate names with different types
    const itemsByName = new Map<string, any[]>()
    const allDbItems = await prisma.menuItem.findMany()

    for (const item of allDbItems) {
        const name = item.name.toLowerCase()
        if (!itemsByName.has(name)) {
            itemsByName.set(name, [])
        }
        itemsByName.get(name)!.push(item)
    }

    // Find and remove duplicates, keeping only the version from data file
    for (const [name, items] of itemsByName.entries()) {
        if (items.length > 1) {
            const dataItem = dataFileMap.get(name)
            if (dataItem) {
                console.log(`Found ${items.length} duplicates of "${name}"`)

                // Keep the one that matches the data file type, delete others
                for (const item of items) {
                    if (item.type !== dataItem.type) {
                        console.log(`  Deleting duplicate "${item.name}" with type "${item.type}" (should be "${dataItem.type}")`)
                        await prisma.menuItem.delete({ where: { id: item.id } })
                        deleted++
                    }
                }
            }
        }
    }

    console.log(`\nCleanup complete!`)
    console.log(`Updated: ${updated} items`)
    console.log(`Deleted: ${deleted} duplicate items`)
}

cleanupMenuItems()
    .catch((e) => {
        console.error('Error during cleanup:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
