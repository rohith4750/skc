import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { menuData } from '@/constants/menu'

const ALL_ROLES = ['super_admin', 'admin', 'transport_admin', 'transport', 'chef', 'supervisor']

const ACTIONS_LIST = ['read', 'write', 'update', 'delete', 'export']

function expandRoute(route: string): string[] {
  return ACTIONS_LIST.map(act => `${route}:${act}`)
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: menuData.flatMap(m => expandRoute(m.route)),
  admin: menuData
    .filter(m => !['/expenses', '/expenses/store-calculator', '/workforce/outstanding', '/workforce', '/analytics', '/audit-logs', '/enquiries', '/stock', '/inventory'].includes(m.route))
    .flatMap(m => expandRoute(m.route)),
  transport_admin: ['/', '/alerts', '/admin/delivery-map', '/users', '/profile'].flatMap(expandRoute),
  transport: ['/', '/admin/delivery-map', '/profile'].flatMap(expandRoute),
  chef: ['/', '/reports/prep-list', '/profile'].flatMap(expandRoute),
  supervisor: ['/', '/reports/prep-list', '/profile'].flatMap(expandRoute)
}

async function checkSuperAdmin(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value
  if (!accessToken) return null

  try {
    const payload = await verifyAccessToken(accessToken)
    if (payload.role !== 'super_admin') return null
    return payload
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const caller = await checkSuperAdmin(request)
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Ensure default role permissions exist in DB and migrate legacy raw paths if found
    const existing = await prisma.rolePermission.findMany()
    const needsMigration = existing.length === 0 || existing.some(rp => rp.permissions.some(p => !p.includes(':')))

    if (needsMigration) {
      await prisma.rolePermission.deleteMany()
      await Promise.all(
        ALL_ROLES.map(role =>
          prisma.rolePermission.create({
            data: {
              role,
              permissions: DEFAULT_ROLE_PERMISSIONS[role] || []
            }
          })
        )
      )
    }

    // 2. Fetch role permissions
    const rolePermissions = await prisma.rolePermission.findMany()

    // 3. Fetch users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true
      },
      orderBy: { username: 'asc' }
    })

    // 4. Get list of configurable routes
    const routes = menuData.map(m => ({
      name: m.name,
      route: m.route,
      section: m.section
    }))

    return NextResponse.json({
      rolePermissions,
      users,
      routes
    })
  } catch (error: any) {
    console.error('Failed to fetch permissions:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const caller = await checkSuperAdmin(request)
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, role, userId, permissions } = body

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permissions must be an array of strings' }, { status: 400 })
    }

    if (type === 'role') {
      if (!role) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 })
      }
      const updated = await prisma.rolePermission.upsert({
        where: { role },
        update: { permissions },
        create: { role, permissions }
      })
      return NextResponse.json({ success: true, data: updated })
    } else if (type === 'user') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { permissions }
      })
      return NextResponse.json({ success: true, data: { id: updated.id, permissions: updated.permissions } })
    } else {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Failed to update permissions:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
