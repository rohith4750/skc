
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
    const username = 'rohithtelidevara'
    const email = 'rohithtelidevara@gmail.com'
    const password = 'admin123'
    const role: UserRole = 'super_admin'

    console.log(`Creating user with email: ${email}, role: ${role}...`)

    const passwordHash = await bcrypt.hash(password, 10)

    try {
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        })

        if (existingUser) {
            console.log('User already exists. Updating role to super_admin...')
            const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    role,
                    passwordHash // Update password too just in case
                }
            })
            console.log('User updated successfully:', updatedUser)
        } else {
            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    passwordHash,
                    role,
                    isActive: true
                }
            })
            console.log('User created successfully:', user)
        }

    } catch (error) {
        console.error('Error creating/updating user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createSuperAdmin()
