import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser() {
  const username = 'rohith'
  const email = 'rohithtelidevara@gmail.com'
  const password = 'Rohith@143'

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'super_admin',
        isActive: true
      }
    })

    console.log('User created successfully:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('User already exists with this username or email. Attempting to update password...')
      try {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            role: 'super_admin'
          }
        })
        console.log('User updated successfully:', {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role
        })
      } catch (updateError) {
        console.error('Error updating user:', updateError)
      }
    } else {
      console.error('Error creating user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
