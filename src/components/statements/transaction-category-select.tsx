'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { toOverridePattern } from '@/lib/categorize'
import { CATEGORIES } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TransactionCategorySelect({
  transactionId, description, category,
}: {
  transactionId: string
  description: string
  category: string
}) {
  const [value, setValue] = useState(category)
  const [saving, setSaving] = useState(false)

  async function handleChange(newCategory: string) {
    setValue(newCategory)
    setSaving(true)
    const supabase = createClient()

    const { error: txError } = await supabase
      .from('transactions')
      .update({ category: newCategory, user_category: newCategory })
      .eq('id', transactionId)

    if (txError) {
      toast.error('Kategori güncellenemedi.')
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('category_overrides').upsert(
        { user_id: user.id, description_pattern: toOverridePattern(description), category: newCategory },
        { onConflict: 'user_id,description_pattern' }
      )
    }

    setSaving(false)
  }

  return (
    <Select value={value} onValueChange={(v) => handleChange(v as string)}>
      <SelectTrigger className="h-8 w-full text-xs" disabled={saving}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
