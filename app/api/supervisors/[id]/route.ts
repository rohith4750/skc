import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const supervisor = await prisma.supervisor.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cateringServiceName: data.cateringServiceName,
        isActive: data.isActive,
      }
    })
    return NextResponse.json(supervisor)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supervisor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supervisor.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete supervisor' }, { status: 500 })
  }
}
