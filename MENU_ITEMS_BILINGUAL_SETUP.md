# Menu Items Bilingual Setup (English + Telugu)

## Overview
Menu items are now stored in the database with support for both English and Telugu languages.

## Database Schema

The `MenuItem` model now includes:
- `name` - English name (required)
- `nameTelugu` - Telugu name (optional)
- `description` - English description (optional)
- `descriptionTelugu` - Telugu description (optional)

## Migration Applied

✅ Migration `20260109174729_add_telugu_fields` has been created and applied to your database.

## Adding Menu Items with Telugu Translations

### Option 1: Through the Application UI
1. Go to the Menu page (`/menu`)
2. Click "Add Menu Item"
3. Fill in:
   - **Name** (English)
   - **Name (Telugu)** (optional)
   - **Type** (sweets, lunch, breakfast, snacks)
   - **Description** (English, optional)
   - **Description (Telugu)** (optional)
4. Save

### Option 2: Using API

```bash
# POST /api/menu
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poornam Burelu",
    "nameTelugu": "పూర్ణం బూరెలు",
    "type": "sweets",
    "description": "SWEETS (Any Two)",
    "descriptionTelugu": "మిఠాయిలు (ఏవైనా రెండు)",
    "isActive": true
  }'
```

### Option 3: Using Seed Script

1. Edit `prisma/seed-menu-items.ts`
2. Add your menu items with Telugu translations
3. Run:
   ```bash
   npx tsx prisma/seed-menu-items.ts
   ```

### Option 4: Using Prisma Studio

1. Run: `npx prisma studio`
2. Open MenuItem table
3. Add/Edit items with Telugu fields

## Example Telugu Translations

Here are some common menu items in Telugu:

| English | Telugu |
|---------|--------|
| Poornam Burelu | పూర్ణం బూరెలు |
| Laddu | లడ్డు |
| Biryani | బిర్యాని |
| Pulihora | పులిహోర |
| Sambar | సాంబార్ |
| Rasam | రసం |
| Dosa | దోస |
| Idli | ఇడ్లి |
| Vada | వడ |
| Puri | పూరీ |

## Database Cleanup (Delete All Menu Items)

If you want to delete all menu items from the database:

### Using SQL:
```sql
DELETE FROM menu_items;
```

### Using Prisma Studio:
1. Run: `npx prisma studio`
2. Open MenuItem table
3. Select all items and delete

### Using API (one by one):
```bash
# First, get all menu items to get their IDs
curl http://localhost:3000/api/menu

# Then delete each one
curl -X DELETE http://localhost:3000/api/menu/{id}
```

## Next Steps

1. **Add Telugu translations** for all your menu items
2. **Update the frontend** to display Telugu names when available
3. **Add language toggle** in the UI to switch between English and Telugu

## API Endpoints

- `GET /api/menu` - Get all menu items (includes Telugu fields)
- `POST /api/menu` - Create menu item (with Telugu fields)
- `PUT /api/menu/[id]` - Update menu item (with Telugu fields)
- `DELETE /api/menu/[id]` - Delete menu item
