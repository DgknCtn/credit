import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CreditCard, Plus, Pencil, Upload } from 'lucide-react'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .order('created_at')

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kartlarım</h1>
          <p className="text-sm text-slate-500 mt-0.5">{cards?.length ?? 0} kart tanımlı</p>
        </div>
        <Link href="/cards/new" className={cn(buttonVariants(), 'gap-2')}>
          <Plus className="w-4 h-4" />
          Kart Ekle
        </Link>
      </div>

      {(cards?.length ?? 0) === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed text-center"
          style={{ borderColor: 'var(--slate-200)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--blue-100)' }}
          >
            <CreditCard className="w-7 h-7" style={{ color: 'var(--blue-600)' }} />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Henüz kart eklemediniz
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--slate-400)', maxWidth: '300px' }}>
            Kredi kartlarınızı ekleyerek ekstre takibine başlayın.
          </p>
          <Link href="/cards/new" className={cn(buttonVariants(), 'gap-2')}>
            <Plus className="w-4 h-4" />
            İlk Kartı Ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards!.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardItem({ card }: { card: { id: string; bank_name: string; card_name: string; last_four_digits: string; statement_day: number; payment_due_days: number; is_active: boolean } }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card visual header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background: 'linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)',
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--slate-400)' }}>
              {card.bank_name}
            </p>
            <p className="text-white font-semibold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
              {card.card_name}
            </p>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: card.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.2)',
              color: card.is_active ? '#34D399' : 'var(--slate-400)',
            }}
          >
            {card.is_active ? 'Aktif' : 'Pasif'}
          </div>
        </div>
        <p
          className="text-lg tracking-[0.2em] tabular-nums font-mono"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          **** **** **** {card.last_four_digits}
        </p>
      </div>

      {/* Card details */}
      <div className="px-5 py-4">
        <div className="flex gap-6 mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--slate-400)' }}>
              Hesap Kesimi
            </p>
            <p className="text-sm font-semibold text-slate-800">Her ayın {card.statement_day}. günü</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--slate-400)' }}>
              Son Ödeme
            </p>
            <p className="text-sm font-semibold text-slate-800">Kesimden +{card.payment_due_days} gün</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/cards/${card.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 flex-1 justify-center')}
          >
            <Pencil className="w-3.5 h-3.5" />
            Düzenle
          </Link>
          <Link
            href="/statements/upload"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 flex-1 justify-center')}
          >
            <Upload className="w-3.5 h-3.5" />
            Ekstre Yükle
          </Link>
        </div>
      </div>
    </div>
  )
}
