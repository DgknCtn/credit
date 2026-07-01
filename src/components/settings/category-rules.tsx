'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/types'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

type Rule = { id: string; description_pattern: string; category: string }

export function CategoryRules({ rules: initialRules }: { rules: Rule[] }) {
  const [rules, setRules] = useState(initialRules)

  async function handleCategoryChange(id: string, category: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, category } : r)))
    const supabase = createClient()
    const { error } = await supabase.from('category_overrides').update({ category }).eq('id', id)
    if (error) toast.error('Kural güncellenemedi.')
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('category_overrides').delete().eq('id', id)
    if (error) {
      toast.error('Kural silinemedi.')
      return
    }
    setRules((prev) => prev.filter((r) => r.id !== id))
    toast.success('Kural silindi.')
  }

  if (rules.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--slate-500)' }}>
        Henüz öğrenilmiş bir kategori kuralı yok. Bir işlemin kategorisini ekstre
        detayından düzelttiğinizde burada görünecek.
      </p>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between gap-3 py-3">
          <p className="text-sm font-medium text-slate-800 truncate flex-1">
            {rule.description_pattern}
          </p>
          <div className="w-44 flex-shrink-0">
            <Select value={rule.category} onValueChange={(v) => handleCategoryChange(rule.id, v as string)}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50"
                  aria-label="Kuralı sil"
                />
              }
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--red-600)' }} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kuralı sil</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{rule.description_pattern}&quot; için öğrenilen kategori kuralı silinecek.
                  Bu işyerinden gelecek yeni işlemler tekrar otomatik tahminle kategorize edilir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(rule.id)}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  )
}
