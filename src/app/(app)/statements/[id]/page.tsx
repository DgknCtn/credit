import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, MONTH_NAMES, maskCardNumber } from '@/lib/utils-app'
import { TransactionCategorySelect } from '@/components/statements/transaction-category-select'
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
            İşlemler ({transactions?.length ?? 0})
          </h2>
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
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-5 py-2.5 whitespace-nowrap tabular-nums text-slate-600">{formatDate(t.transaction_date)}</td>
                  <td className="px-5 py-2.5 text-slate-800">{t.description}</td>
                  <td className="px-5 py-2.5 text-slate-500">{t.installment_info ?? '—'}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium text-slate-900">{formatCurrency(t.amount, t.currency)}</td>
                  <td className="px-5 py-2.5 w-44">
                    <TransactionCategorySelect transactionId={t.id} description={t.description} category={t.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
