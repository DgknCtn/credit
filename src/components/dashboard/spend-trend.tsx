'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils-app'

export type TrendPoint = { month: number; year: number; total: number }

export function SpendTrend({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({
    label: `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${String(d.year).slice(2)}`,
    total: d.total,
  }))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-slate-800 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Son 6 Ay Harcama Trendi
      </h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--slate-100)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--slate-400)' }}
            axisLine={{ stroke: 'var(--slate-200)' }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'var(--slate-50)' }}
            formatter={(value) => [formatCurrency(Number(value)), 'Toplam']}
            contentStyle={{
              border: '1px solid var(--slate-200)',
              borderRadius: 10,
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
          <Bar dataKey="total" fill="var(--blue-500)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
