'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Card as CardType } from '@/lib/types'
import { CreditCard } from 'lucide-react'

type Props = {
  card?: CardType
}

export function CardForm({ card }: Props) {
  const router = useRouter()
  const isEditing = !!card

  const [values, setValues] = useState({
    bank_name: card?.bank_name ?? '',
    card_name: card?.card_name ?? '',
    last_four_digits: card?.last_four_digits ?? '',
    statement_day: String(card?.statement_day ?? ''),
    payment_due_days: String(card?.payment_due_days ?? '10'),
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const lastFour = values.last_four_digits.replace(/\D/g, '').slice(-4)
    if (lastFour.length !== 4) {
      toast.error('Son 4 hane 4 rakam olmalıdır.')
      setLoading(false)
      return
    }

    const payload = {
      bank_name: values.bank_name.trim(),
      card_name: values.card_name.trim(),
      last_four_digits: lastFour,
      statement_day: Number(values.statement_day),
      payment_due_days: Number(values.payment_due_days),
    }

    const supabase = createClient()

    if (isEditing) {
      const { error } = await supabase.from('cards').update(payload).eq('id', card.id)
      if (error) { toast.error('Güncelleme başarısız.'); setLoading(false); return }
      toast.success('Kart güncellendi.')
    } else {
      const { error } = await supabase.from('cards').insert(payload)
      if (error) { toast.error('Kart eklenemedi.'); setLoading(false); return }
      toast.success('Kart eklendi.')
    }

    router.push('/cards')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Card preview */}
      <div
        className="rounded-2xl px-6 py-5 text-white"
        style={{ background: 'linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)' }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--slate-400)' }}>
              {values.bank_name || 'Banka Adı'}
            </p>
            <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {values.card_name || 'Kart Adı'}
            </p>
          </div>
          <CreditCard className="w-6 h-6 opacity-60" />
        </div>
        <p className="text-lg tracking-[0.2em] font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
          **** **** **** {values.last_four_digits || '????'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
                Banka Adı
              </Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={values.bank_name}
                onChange={handleChange}
                placeholder="Garanti, Akbank..."
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card_name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
                Kart Adı
              </Label>
              <Input
                id="card_name"
                name="card_name"
                value={values.card_name}
                onChange={handleChange}
                placeholder="Bonus, Axess..."
                required
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_four_digits" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Son 4 Hane
            </Label>
            <Input
              id="last_four_digits"
              name="last_four_digits"
              value={values.last_four_digits}
              onChange={handleChange}
              placeholder="1234"
              maxLength={4}
              pattern="[0-9]{4}"
              required
              className="h-10"
            />
            <p className="text-xs" style={{ color: 'var(--slate-400)' }}>
              Tam kart numarası saklanmaz — yalnızca son 4 hane kaydedilir.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="statement_day" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
                Hesap Kesim Günü
              </Label>
              <Input
                id="statement_day"
                name="statement_day"
                type="number"
                min={1}
                max={31}
                value={values.statement_day}
                onChange={handleChange}
                placeholder="15"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_due_days" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
                Son Ödeme (+gün)
              </Label>
              <Input
                id="payment_due_days"
                name="payment_due_days"
                type="number"
                min={1}
                max={30}
                value={values.payment_due_days}
                onChange={handleChange}
                placeholder="10"
                required
                className="h-10"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1 h-10 font-semibold" disabled={loading}>
              {loading ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kartı Ekle'}
            </Button>
            <Link
              href="/cards"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5 font-medium')}
            >
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
