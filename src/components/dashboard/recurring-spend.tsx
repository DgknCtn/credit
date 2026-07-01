import { formatCurrency } from '@/lib/utils-app'
import { Repeat, TrendingUp } from 'lucide-react'

export type RecurringItem = {
  key: string
  description: string
  category: string
  periodsSeen: number
  lastAmount: number
  currency: string
  previousAmount: number | null
  deltaPercent: number | null
}

export function RecurringSpend({ items }: { items: RecurringItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <Repeat className="w-4 h-4" style={{ color: 'var(--blue-600)' }} />
        <h2 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
          Tekrarlayan Harcamalar
        </h2>
      </div>
      <div className="divide-y divide-slate-100 px-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3.5 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.description}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--slate-400)' }}>
                {item.category} • Son {item.periodsSeen} ayda görüldü
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold tabular-nums text-slate-900">
                {formatCurrency(item.lastAmount, item.currency)}
              </p>
              {item.deltaPercent != null && item.deltaPercent > 1 && (
                <p className="text-xs font-semibold flex items-center gap-1 justify-end mt-0.5" style={{ color: 'var(--red-600)' }}>
                  <TrendingUp className="w-3 h-3" />
                  %{item.deltaPercent.toFixed(0)} arttı
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
