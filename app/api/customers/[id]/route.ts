import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEmail, isPhone, validateRequiredFields } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!customer) {
      return NextResponse.json({ 
        error: 'Customer not found',
        details: `No customer found with id: ${params.id}`
      }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch customer', 
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const missingFields = validateRequiredFields(data, ['name', 'phone', 'email', 'address'])
    if (missingFields) {
      return NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      )
    }
    if (!isPhone(data.phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    if (!isEmail(data.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
      }
    })
    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error updating customer:', error)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Customer not found',
        details: `No customer found with id: ${params.id}`
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to update customer', 
      details: error?.message || String(error),
      code: error?.code
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Customer not found',
        details: `No customer found with id: ${params.id}`
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete customer',
      details: error?.message || String(error),
      code: error?.code
    }, { status: 500 })
  }
}
