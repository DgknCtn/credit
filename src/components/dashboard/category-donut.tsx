'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils-app'

const COLORS = [
  'var(--blue-500)', 'var(--emerald-500)', 'var(--amber-500)',
  'var(--red-600)', 'var(--navy-600)', 'var(--blue-400)',
  'var(--emerald-600)', 'var(--slate-400)', 'var(--slate-600)',
  'var(--blue-600)', 'var(--amber-100)', 'var(--slate-300)',
]

export function CategoryDonut({ data }: { data: { category: string; amount: number }[] }) {
  if (data.length === 0) return null

  return (
    <div className="flex justify-center py-2">
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={40}
            outerRadius={62}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            contentStyle={{
              border: '1px solid var(--slate-200)',
              borderRadius: 10,
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
