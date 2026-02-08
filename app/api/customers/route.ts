import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEmail, isPhone, validateRequiredFields } from '@/lib/validation'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Only name and address are required
    const missingFields = validateRequiredFields(data, ['name', 'address'])
    if (missingFields) {
      return NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      )
    }

    // Validate phone only if provided
    if (data.phone && !isPhone(data.phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Validate email only if provided
    if (data.email && !isEmail(data.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address,
      }
    })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
