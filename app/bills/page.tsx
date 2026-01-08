'use client'

import { useEffect, useState } from 'react'
import { Storage } from '@/lib/storage-api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import { FaPrint, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import { getBillTableConfig } from '@/components/table-configs'

export default function BillsPage() {
  const [bills, setBills] = useState<Array<Bill & { order?: Order & { customer?: Customer } }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      const allBills = await Storage.getBills()
      // API already includes order and customer data
      setBills(allBills.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (error) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills. Please try again.')
    }
  }

  const handleMarkPaid = async (billId: string) => {
    const bill = bills.find((b: any) => b.id === billId)
    if (!bill) return

    try {
      const updatedBill = {
        id: bill.id,
        paidAmount: bill.totalAmount,
        remainingAmount: 0,
        status: 'paid' as const,
      }

      // API updates both bill and order automatically
      await Storage.saveBill(updatedBill)
      await loadBills()
      toast.success('Bill marked as paid successfully!')
    } catch (error) {
      console.error('Failed to update bill:', error)
      toast.error('Failed to update bill. Please try again.')
    }
  }

  const handlePrint = (bill: any) => {
    window.print()
  }

  const tableConfig = getBillTableConfig()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bills</h1>
        <p className="text-gray-600 mt-2">View and manage customer bills</p>
      </div>

      <Table
        columns={tableConfig.columns}
        data={bills}
        emptyMessage={tableConfig.emptyMessage}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={bills.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemName={tableConfig.itemName}
        getItemId={tableConfig.getItemId}
        renderActions={(bill) => (
          <div className="flex items-center gap-2">
            {bill.status !== 'paid' && (
              <button
                onClick={() => handleMarkPaid(bill.id)}
                className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                title="Mark as Paid"
              >
                <FaCheck />
              </button>
            )}
            <button
              onClick={() => handlePrint(bill)}
              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
              title="Print"
            >
              <FaPrint />
            </button>
          </div>
        )}
      />
    </div>
  )
}
