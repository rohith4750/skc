import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser() {
  // Change these values as needed
  const username = 'admin'
  const email = 'admin@skccaterers.com'
  const password = 'admin123' // Change this to a strong password!

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

    console.log('✅ User created successfully!')
    console.log('Username:', user.username)
    console.log('Email:', user.email)
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
