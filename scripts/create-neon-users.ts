import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUsers() {
  try {
    console.log('Creating users in Neon database...')

    // Hash passwords
    const superAdminPassword = await bcrypt.hash('Rohith@143', 10)
    const adminPassword = await bcrypt.hash('Rohith@143', 10)

    // Create Super Admin
    try {
      const superAdmin = await prisma.user.upsert({
        where: { email: 'pujyasri1989cya@gmail.com' },
        update: {
          username: 'superadmin',
          email: 'pujyasri1989cya@gmail.com',
          passwordHash: superAdminPassword,
          role: 'super_admin',
          isActive: true,
        },
        create: {
          username: 'superadmin',
          email: 'pujyasri1989cya@gmail.com',
          passwordHash: superAdminPassword,
          role: 'super_admin',
          isActive: true,
        },
      })
      console.log('✅ Super Admin created/updated:', superAdmin.email)
    } catch (error: any) {
      console.error('Error creating super admin:', error.message)
    }

    // Create Admin
    try {
      const admin = await prisma.user.upsert({
        where: { email: 'skc1989cya@gmail.com' },
        update: {
          username: 'admin',
          email: 'skc1989cya@gmail.com',
          passwordHash: adminPassword,
          role: 'admin',
          isActive: true,
        },
        create: {
          username: 'admin',
          email: 'skc1989cya@gmail.com',
          passwordHash: adminPassword,
          role: 'admin',
          isActive: true,
        },
      })
      console.log('✅ Admin created/updated:', admin.email)
    } catch (error: any) {
      console.error('Error creating admin:', error.message)
    }

    console.log('\n✅ All users created successfully!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUsers()
