'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CATEGORIES } from '@/lib/types'
import { formatCurrency, formatDate, MONTH_NAMES } from '@/lib/utils-app'
import { AlertTriangle, FileText, Loader2, Upload } from 'lucide-react'

type CardOption = { id: string; bank_name: string; card_name: string; last_four_digits: string }

type PreviewTransaction = {
  transaction_date: string
  description: string
  amount: number
  currency: string
  category: string
  guessed_category: string
  installment_info: string | null
  confidence_score: number
  raw_text: string
}

type ParseResponse = {
  transactions: PreviewTransaction[]
  statement_total: number | null
  minimum_payment: number | null
  due_date: string | null
  period_month: number | null
  period_year: number | null
  duplicate: boolean
  low_confidence_count: number
}

export function UploadForm({ cards }: { cards: CardOption[] }) {
  const router = useRouter()
  const [cardId, setCardId] = useState<string>(cards[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [preview, setPreview] = useState<ParseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleParse() {
    if (!file || !cardId) {
      toast.error('Kart ve PDF dosyası seçmelisiniz.')
      return
    }
    setParsing(true)
    setError(null)
    setPreview(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('card_id', cardId)

    try {
      const res = await fetch('/api/statements/parse', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'PDF metni çıkarılamadı.')
        return
      }
      if (data.transactions.length === 0) {
        setError('PDF içinden işlem satırı ayrıştırılamadı. Farklı bir ekstre deneyin veya manuel giriş yapın.')
        return
      }
      const withGuess: ParseResponse = {
        ...data,
        transactions: data.transactions.map((t: PreviewTransaction) => ({ ...t, guessed_category: t.category })),
      }
      setPreview(withGuess)
    } catch {
      setError('PDF işlenirken bir hata oluştu.')
    } finally {
      setParsing(false)
    }
  }

  function updateTransaction(index: number, patch: Partial<PreviewTransaction>) {
    if (!preview) return
    const transactions = preview.transactions.slice()
    transactions[index] = { ...transactions[index], ...patch }
    setPreview({ ...preview, transactions })
  }

  async function handleConfirm(overwrite = false) {
    if (!preview || !preview.period_month || !preview.period_year) {
      toast.error('Dönem bilgisi tespit edilemedi.')
      return
    }
    setConfirming(true)
    try {
      const res = await fetch('/api/statements/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          period_month: preview.period_month,
          period_year: preview.period_year,
          statement_total: preview.statement_total,
          minimum_payment: preview.minimum_payment,
          due_date: preview.due_date,
          transactions: preview.transactions,
          overwrite,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'duplicate') {
          const ok = window.confirm('Bu dönem için zaten ekstre yüklenmiş. Üzerine yazılsın mı?')
          if (ok) {
            setConfirming(false)
            await handleConfirm(true)
          } else {
            setConfirming(false)
          }
          return
        }
        toast.error(data.error ?? 'Kaydedilemedi.')
        return
      }
      toast.success('Ekstre kaydedildi.')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Kaydedilirken bir hata oluştu.')
    } finally {
      setConfirming(false)
    }
  }

  if (!cards.length) {
    return (
      <p className="text-sm" style={{ color: 'var(--slate-500)' }}>
        Ekstre yükleyebilmek için önce bir kart eklemelisiniz.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Kart
            </Label>
            <Select value={cardId} onValueChange={(v) => setCardId(v as string)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Kart seçin" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.bank_name} — {c.card_name} (**** {c.last_four_digits})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Ekstre PDF
            </Label>
            <Input
              type="file"
              accept="application/pdf"
              className="h-10 pt-2"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <Button onClick={handleParse} disabled={parsing || !file} className="gap-2">
          {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {parsing ? 'Ayrıştırılıyor...' : 'PDF’i Ayrıştır'}
        </Button>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
            <p className="text-sm" style={{ color: '#B91C1C' }}>{error}</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'var(--blue-600)' }} />
              <p className="text-sm font-semibold text-slate-800">
                {preview.period_month && preview.period_year
                  ? `${MONTH_NAMES[preview.period_month - 1]} ${preview.period_year}`
                  : 'Dönem tespit edilemedi'}
                {' • '}{preview.transactions.length} işlem
              </p>
            </div>
            <div className="flex gap-4 text-xs" style={{ color: 'var(--slate-500)' }}>
              {preview.statement_total != null && <span>Toplam: <strong>{formatCurrency(preview.statement_total)}</strong></span>}
              {preview.due_date && <span>Son ödeme: <strong>{formatDate(preview.due_date)}</strong></span>}
            </div>
          </div>

          {preview.low_confidence_count > 0 && (
            <div className="px-6 py-2.5 text-xs" style={{ background: '#FFF7ED', color: '#9A3412' }}>
              {preview.low_confidence_count} satır düşük güvenle ayrıştırıldı — kontrol edin.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left" style={{ color: 'var(--slate-400)' }}>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Açıklama</th>
                  <th className="px-4 py-2 font-medium">Taksit</th>
                  <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  <th className="px-4 py-2 font-medium">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {preview.transactions.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50"
                    style={t.confidence_score < 0.7 ? { background: '#FFFBEB' } : undefined}
                  >
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums text-slate-600">{formatDate(t.transaction_date)}</td>
                    <td className="px-4 py-2">
                      <Input
                        value={t.description}
                        onChange={(e) => updateTransaction(i, { description: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500">{t.installment_info ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={t.amount}
                        onChange={(e) => updateTransaction(i, { amount: Number(e.target.value) })}
                        className="h-8 text-sm text-right w-28 ml-auto tabular-nums"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Select value={t.category} onValueChange={(v) => updateTransaction(i, { category: v as string })}>
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => handleConfirm(false)} disabled={confirming} className="gap-2">
              {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirming ? 'Kaydediliyor...' : 'Onayla ve Kaydet'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
