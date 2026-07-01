import { formatCurrency, MONTH_NAMES } from '@/lib/utils-app'

export type TrendPoint = { month: number; year: number; total: number }

export function SpendTrend({ data }: { data: TrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-slate-800 mb-5" style={{ fontFamily: 'var(--font-display)' }}>
        Son 6 Ay Harcama Trendi
      </h2>
      <div className="flex items-end gap-3 h-32">
        {data.map((d) => {
          const heightPct = d.total > 0 ? Math.max((d.total / max) * 100, 4) : 0
          return (
            <div key={`${d.month}-${d.year}`} className="flex-1 flex flex-col items-center justify-end h-full">
              <p className="text-[10px] tabular-nums mb-1" style={{ color: 'var(--slate-500)' }}>
                {d.total > 0 ? formatCurrency(d.total).replace(/\s*TL$/, '') : ''}
              </p>
              <div className="w-full flex items-end h-full">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{ height: `${heightPct}%`, background: d.total > 0 ? 'var(--blue-500)' : 'var(--slate-100)' }}
                />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--slate-400)' }}>
                {MONTH_NAMES[d.month - 1].slice(0, 3)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
