'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MONTH_NAMES } from '@/lib/utils-app'

type CardOption = { id: string; bank_name: string; card_name: string; last_four_digits: string }

function buildPeriodOptions(count: number) {
  const options: { value: string; label: string; month: number; year: number }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    options.push({ value: `${month}-${year}`, label: `${MONTH_NAMES[month - 1]} ${year}`, month, year })
  }
  return options
}

export function FilterBar({
  cards, selectedMonth, selectedYear, selectedCardId,
}: {
  cards: CardOption[]
  selectedMonth: number
  selectedYear: number
  selectedCardId: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const periodOptions = buildPeriodOptions(12)
  const currentPeriodValue = `${selectedMonth}-${selectedYear}`

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/dashboard?${params.toString()}`)
  }

  function handlePeriodChange(value: string) {
    const [month, year] = value.split('-')
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', month)
    params.set('year', year)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={currentPeriodValue} onValueChange={(v) => handlePeriodChange(v as string)}>
        <SelectTrigger className="h-9 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCardId ?? 'all'} onValueChange={(v) => updateParam('card', v === 'all' ? null : (v as string))}>
        <SelectTrigger className="h-9 w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm kartlar</SelectItem>
          {cards.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.bank_name} — {c.card_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
