'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type BudgetMap = Record<string, string>

export function BudgetSettings({
  userId, initialBudgets,
}: {
  userId: string
  initialBudgets: { category: string; monthly_limit: number }[]
}) {
  const [values, setValues] = useState<BudgetMap>(() => {
    const map: BudgetMap = {}
    for (const b of initialBudgets) map[b.category] = String(b.monthly_limit)
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)

  async function handleBlur(category: string) {
    const raw = values[category]?.trim()
    const supabase = createClient()
    setSaving(category)

    if (!raw) {
      const { error } = await supabase
        .from('category_budgets')
        .delete()
        .eq('user_id', userId)
        .eq('category', category)
      if (error) toast.error('Bütçe kaldırılamadı.')
      setSaving(null)
      return
    }

    const monthly_limit = Number(raw.replace(',', '.'))
    if (Number.isNaN(monthly_limit) || monthly_limit < 0) {
      toast.error('Geçerli bir tutar girin.')
      setSaving(null)
      return
    }

    const { error } = await supabase
      .from('category_budgets')
      .upsert({ user_id: userId, category, monthly_limit }, { onConflict: 'user_id,category' })

    if (error) toast.error('Bütçe kaydedilemedi.')
    setSaving(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Kategori Bütçeleri</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--slate-400)' }}>
          Aylık limit girilen kategoriler dashboard&apos;da ilerleme çubuğuyla gösterilir. Boş bırakmak limiti kaldırır.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <div key={category} className="space-y-1">
            <Label className="text-xs font-medium" style={{ color: 'var(--slate-500)' }}>{category}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Limit yok"
              value={values[category] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [category]: e.target.value }))}
              onBlur={() => handleBlur(category)}
              disabled={saving === category}
              className="h-9"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
