# Create User Script

To create a user account, you can use this script. Save it as `create-user.ts` in the root directory and run it with `npx tsx create-user.ts`.

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser() {
  const username = 'admin' // Change this
  const email = 'admin@skccaterers.com' // Change this
  const password = 'admin123' // Change this - use a strong password!

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isActive: true
      }
    })

    console.log('User created successfully:', user)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('User already exists with this username or email')
    } else {
      console.error('Error creating user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
```

## Quick Setup

1. Install tsx if not already installed:
   ```bash
   npm install --save-dev tsx
   ```

2. Create the script file and update username, email, and password

3. Run it:
   ```bash
   npx tsx create-user.ts
   ```

**Important**: Delete this script file after creating the user for security!
