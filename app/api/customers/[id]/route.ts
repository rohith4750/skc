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
    // Check if customer has any orders
    const customerWithOrders = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          select: { id: true }
        }
      }
    })

    if (!customerWithOrders) {
      return NextResponse.json({ 
        error: 'Customer not found',
        details: `No customer found with id: ${params.id}`
      }, { status: 404 })
    }

    if (customerWithOrders.orders.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete customer',
        details: `This customer has ${customerWithOrders.orders.length} order(s). Please delete the orders first or mark the customer as inactive instead.`
      }, { status: 400 })
    }

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

    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete customer',
        details: 'This customer has related records (orders, bills). Please delete those first.'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete customer',
      details: error?.message || String(error),
      code: error?.code
    }, { status: 500 })
  }
}
