import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, MONTH_NAMES, maskCardNumber } from '@/lib/utils-app'
import { TransactionTable } from '@/components/statements/transaction-table'
import { ArrowLeft } from 'lucide-react'

export default async function StatementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: statement } = await supabase
    .from('statements')
    .select('*, card:cards(bank_name, card_name, last_four_digits)')
    .eq('id', id)
    .single()

  if (!statement) notFound()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('statement_id', id)
    .order('transaction_date')

  const total = (transactions ?? []).reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <Link href="/statements" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--blue-600)' }}>
        <ArrowLeft className="w-4 h-4" />
        Ekstrelere dön
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {statement.card?.bank_name} — {statement.card?.card_name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {maskCardNumber(statement.card?.last_four_digits ?? '')} • {MONTH_NAMES[statement.period_month - 1]} {statement.period_year}
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-400)' }}>Dönem Borcu</p>
            <p className="text-lg font-bold tabular-nums text-slate-900">
              {statement.statement_total != null ? formatCurrency(statement.statement_total) : formatCurrency(total)}
            </p>
          </div>
          {statement.due_date && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-400)' }}>Son Ödeme</p>
              <p className="text-lg font-bold text-slate-900">{formatDate(statement.due_date)}</p>
            </div>
          )}
        </div>
      </div>

      <TransactionTable statementId={id} transactions={transactions ?? []} />
    </div>
  )
}
