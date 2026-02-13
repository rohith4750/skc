import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, validateEnum } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workforce = await (prisma as any).workforce.findUnique({
      where: { id: params.id },
    })

    if (!workforce) {
      return NextResponse.json(
        { error: 'Workforce member not found' },
        { status: 404 }
      )
    }

    publishNotification({
      type: 'workforce',
      title: 'Workforce updated',
      message: `${workforce.name} · ${workforce.role}`,
      entityId: workforce.id,
      severity: 'info',
    })

    return NextResponse.json(workforce)
  } catch (error: any) {
    console.error('Error fetching workforce:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workforce member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // Validate role if provided
    if (data.role) {
      const validRoles = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']
      if (!validateEnum(data.role, validRoles)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be one of: supervisor, chef, labours, boys, transport, gas, pan, store, other' },
          { status: 400 }
        )
      }
    }

    if (data.name !== undefined && !isNonEmptyString(data.name)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const workforce = await (prisma as any).workforce.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(workforce)
  } catch (error: any) {
    console.error('Error updating workforce:', error)
    return NextResponse.json(
      { error: 'Failed to update workforce member', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if workforce member exists
    const workforce = await (prisma as any).workforce.findUnique({
      where: { id: params.id }
    })

    if (!workforce) {
      return NextResponse.json(
        { error: 'Workforce member not found' },
        { status: 404 }
      )
    }

    // Delete the member first
    await (prisma as any).workforce.delete({
      where: { id: params.id }
    })

    // If this was the last member, clear workforce payments so analytics reset
    const remaining = await (prisma as any).workforce.count()
    if (remaining === 0) {
      try {
        await (prisma as any).workforcePayment.deleteMany({})
      } catch {
        // Table may not exist
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workforce:', error)
    return NextResponse.json(
      { error: 'Failed to delete workforce member', details: error.message },
      { status: 500 }
    )
  }
}
