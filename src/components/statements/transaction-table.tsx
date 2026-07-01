'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils-app'
import type { Transaction } from '@/lib/types'
import { TransactionCategorySelect } from '@/components/statements/transaction-category-select'
import { AddTransactionDialog } from '@/components/statements/add-transaction-dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

export function TransactionTable({
  statementId, transactions: initialTransactions,
}: {
  statementId: string
  transactions: Transaction[]
}) {
  const [transactions, setTransactions] = useState(initialTransactions)

  function handleAdded(transaction: Transaction) {
    setTransactions((prev) =>
      [...prev, transaction].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))
    )
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      toast.error('İşlem silinemedi.')
      return
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    toast.success('İşlem silindi.')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
          İşlemler ({transactions.length})
        </h2>
        <AddTransactionDialog statementId={statementId} onAdded={handleAdded} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left" style={{ color: 'var(--slate-400)' }}>
              <th className="px-5 py-2 font-medium">Tarih</th>
              <th className="px-5 py-2 font-medium">Açıklama</th>
              <th className="px-5 py-2 font-medium">Taksit</th>
              <th className="px-5 py-2 font-medium text-right">Tutar</th>
              <th className="px-5 py-2 font-medium">Kategori</th>
              <th className="px-5 py-2 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-slate-50">
                <td className="px-5 py-2.5 whitespace-nowrap tabular-nums text-slate-600">{formatDate(t.transaction_date)}</td>
                <td className="px-5 py-2.5 text-slate-800">{t.description}</td>
                <td className="px-5 py-2.5 text-slate-500">{t.installment_info ?? '—'}</td>
                <td className="px-5 py-2.5 text-right tabular-nums font-medium text-slate-900">{formatCurrency(t.amount, t.currency)}</td>
                <td className="px-5 py-2.5 w-44">
                  <TransactionCategorySelect transactionId={t.id} description={t.description} category={t.category} />
                </td>
                <td className="px-5 py-2.5">
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
                          aria-label="İşlemi sil"
                        />
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--red-600)' }} />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>İşlemi sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{t.description}&quot; ({formatCurrency(t.amount, t.currency)}) kalıcı olarak silinecek.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(t.id)}>Sil</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
