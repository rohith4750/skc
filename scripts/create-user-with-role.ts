import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser() {
  // Change these values as needed
  const username = 'superadmin'
  const email = 'superadmin@skccaterers.com'
  const password = 'superadmin123' // Change this to a strong password!
  const role = 'super_admin' // or 'admin'

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        isActive: true
      }
    })

    console.log('✅ User created successfully!')
    console.log('Username:', user.username)
    console.log('Email:', user.email)
    console.log('Role:', user.role)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ User already exists with this username or email')
    } else {
      console.error('❌ Error creating user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
