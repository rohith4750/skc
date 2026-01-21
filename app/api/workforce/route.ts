import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, validateEnum } from '@/lib/validation'

export async function GET() {
  try {
    const workforce = await (prisma as any).workforce.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Fetch all expenses
    const expenses = await (prisma as any).expense.findMany({
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    })

    // Map expenses to workforce members
    const workforceWithPayments = workforce.map((member: any) => {
      // Match expenses ONLY by recipient name to ensure each workforce member
      // gets expenses only for their specific name, not all expenses of their role
      const matchingExpenses = expenses.filter((expense: any) => {
        // Match by recipient name (case-insensitive, exact or partial match)
        // This ensures expenses are matched to the specific person, not just by role
        if (!expense.recipient) return false
        
        const recipientName = expense.recipient.toLowerCase().trim()
        const memberName = member.name.toLowerCase().trim()
        
        // Exact match or name contains member name or member name contains recipient name
        return (
          recipientName === memberName ||
          recipientName.includes(memberName) ||
          memberName.includes(recipientName)
        )
      })

      // Calculate totals and payment status
      const totalAmount = matchingExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      const totalPaidAmount = matchingExpenses.reduce((sum: number, exp: any) => sum + (exp.paidAmount || 0), 0)
      const expenseCount = matchingExpenses.length
      
      // Calculate payment status summary
      const pendingExpenses = matchingExpenses.filter((exp: any) => exp.paymentStatus === 'pending').length
      const partialExpenses = matchingExpenses.filter((exp: any) => exp.paymentStatus === 'partial').length
      const paidExpenses = matchingExpenses.filter((exp: any) => exp.paymentStatus === 'paid').length
      
      // Overall payment status for this member
      let overallPaymentStatus = 'paid'
      if (totalPaidAmount === 0) {
        overallPaymentStatus = 'pending'
      } else if (totalPaidAmount < totalAmount) {
        overallPaymentStatus = 'partial'
      }

      return {
        ...member,
        expenses: matchingExpenses,
        totalAmount,
        totalPaidAmount,
        expenseCount,
        pendingExpenses,
        partialExpenses,
        paidExpenses,
        overallPaymentStatus,
      }
    })

    return NextResponse.json(workforceWithPayments)
  } catch (error: any) {
    console.error('Error fetching workforce:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workforce', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!isNonEmptyString(data.name) || !isNonEmptyString(data.role)) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']
    if (!validateEnum(data.role, validRoles)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: supervisor, chef, labours, boys, transport, gas, pan, store, other' },
        { status: 400 }
      )
    }

    // Create workforce member
    const workforce = await (prisma as any).workforce.create({
      data: {
        name: data.name,
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    return NextResponse.json(workforce, { status: 201 })
  } catch (error: any) {
    console.error('Error creating workforce:', error)
    return NextResponse.json(
      { error: 'Failed to create workforce member', details: error.message },
      { status: 500 }
    )
  }
}
