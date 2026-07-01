import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, MONTH_NAMES } from '@/lib/utils-app'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, Plus } from 'lucide-react'

export default async function StatementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: statements } = await supabase
    .from('statements')
    .select('*, card:cards(bank_name, card_name, last_four_digits)')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ekstreler</h1>
          <p className="text-sm text-slate-500 mt-0.5">{statements?.length ?? 0} ekstre yüklendi</p>
        </div>
        <Link href="/statements/upload" className={cn(buttonVariants(), 'gap-2')}>
          <Plus className="w-4 h-4" />
          Ekstre Yükle
        </Link>
      </div>

      {(statements?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed text-center" style={{ borderColor: 'var(--slate-200)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--blue-100)' }}>
            <FileText className="w-7 h-7" style={{ color: 'var(--blue-600)' }} />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Henüz ekstre yüklenmedi
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--slate-400)', maxWidth: '300px' }}>
            İlk ekstrenizi yükleyerek harcamalarınızı takibe başlayın.
          </p>
          <Link href="/statements/upload" className={cn(buttonVariants(), 'gap-2')}>
            <Plus className="w-4 h-4" />
            Ekstre Yükle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {statements!.map((s) => (
            <Link
              key={s.id}
              href={`/statements/${s.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {s.card?.bank_name} — {s.card?.card_name}
                  <span className="font-normal ml-1.5 tabular-nums" style={{ color: 'var(--slate-400)' }}>
                    **** {s.card?.last_four_digits}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--slate-400)' }}>
                  {MONTH_NAMES[s.period_month - 1]} {s.period_year}
                  {s.due_date && ` • Son ödeme ${formatDate(s.due_date)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {s.statement_total != null ? formatCurrency(s.statement_total) : '—'}
                </p>
                <p
                  className="text-xs font-medium"
                  style={{ color: s.processing_status === 'completed' ? 'var(--blue-600)' : 'var(--slate-400)' }}
                >
                  {s.processing_status === 'completed' ? 'Tamamlandı' : s.processing_status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
