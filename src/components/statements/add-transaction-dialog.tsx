'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, type Transaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export function AddTransactionDialog({
  statementId, onAdded,
}: {
  statementId: string
  onAdded: (transaction: Transaction) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    category: 'Diğer' as string,
  })

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(values.amount.replace(',', '.'))
    if (!values.description.trim() || Number.isNaN(amount) || amount === 0) {
      toast.error('Açıklama ve geçerli bir tutar girmelisiniz.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum bulunamadı.'); setLoading(false); return }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        statement_id: statementId,
        user_id: user.id,
        transaction_date: values.transaction_date,
        description: values.description.trim(),
        amount,
        currency: 'TRY',
        category: values.category,
        confidence_score: 1,
      })
      .select()
      .single()

    setLoading(false)
    if (error || !data) {
      toast.error('İşlem eklenemedi.')
      return
    }

    onAdded(data)
    toast.success('İşlem eklendi.')
    setOpen(false)
    setValues({ transaction_date: new Date().toISOString().slice(0, 10), description: '', amount: '', category: 'Diğer' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Plus className="w-3.5 h-3.5" />
        İşlem Ekle
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manuel İşlem Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tx-date" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Tarih
            </Label>
            <Input
              id="tx-date"
              type="date"
              value={values.transaction_date}
              onChange={(e) => update('transaction_date', e.target.value)}
              className="h-9"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-desc" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Açıklama
            </Label>
            <Input
              id="tx-desc"
              value={values.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="İşyeri adı"
              className="h-9"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-amount" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Tutar (TL)
            </Label>
            <Input
              id="tx-amount"
              type="number"
              step="0.01"
              value={values.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0,00"
              className="h-9"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Kategori
            </Label>
            <Select value={values.category} onValueChange={(v) => update('category', v as string)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
