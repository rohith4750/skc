import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  const username = 'superadmin'
  const email = 'skc1989cya@gmail.com'
  const password = 'Rohith@143'
  const role = 'super_admin'

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

    console.log('✅ Super Admin user created successfully!')
    console.log('Username:', user.username)
    console.log('Email:', user.email)
    console.log('Role:', user.role)
    console.log('ID:', user.id)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ User already exists with this username or email')
      console.error('Please use a different username or email, or update the existing user')
    } else {
      console.error('❌ Error creating user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
