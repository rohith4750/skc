// Utility function to initialize menu items
import { Storage } from './storage-api'
import { MenuItem } from '@/types'
import { menuItemsData } from '@/data/menuItems'

export async function initializeMenuItems() {
  // Check if menu items already exist
  const existingItems = await Storage.getMenuItems()

  // Only initialize if menu is empty
  if (existingItems.length === 0) {
    for (const item of menuItemsData) {
      await Storage.saveMenuItem({
        name: item.name,
        nameTelugu: item.nameTelugu,
        type: item.type,
        description: item.description,
        descriptionTelugu: item.descriptionTelugu,
        isActive: true,
      })
    }
    return true
  }
  return false
}
