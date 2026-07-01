import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, getDaysUntil, formatDate, MONTH_NAMES } from '@/lib/utils-app'
import { cn } from '@/lib/utils'
import { CreditCard, ArrowUpRight, AlertCircle, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

  const [{ data: cards }, { data: statements }] = await Promise.all([
    supabase.from('cards').select('*').eq('is_active', true).order('created_at'),
    supabase
      .from('statements')
      .select('*, card:cards(bank_name, card_name, last_four_digits)')
      .eq('processing_status', 'completed')
      .gte('period_year', prevYear)
      .order('due_date', { ascending: true }),
  ])

  const allStatements = statements ?? []

  const currentMonthStatements = allStatements.filter(
    (s) => s.period_month === currentMonth && s.period_year === currentYear
  )
  const prevMonthStatements = allStatements.filter(
    (s) => s.period_month === prevMonth && s.period_year === prevYear
  )

  const totalThisMonth = currentMonthStatements.reduce((sum, s) => sum + (s.statement_total ?? 0), 0)
  const totalLastMonth = prevMonthStatements.reduce((sum, s) => sum + (s.statement_total ?? 0), 0)
  const deltaPercent = totalLastMonth > 0
    ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
    : null

  const upcomingPayments = allStatements.filter((s) => {
    if (!s.due_date) return false
    const days = getDaysUntil(s.due_date)
    return days >= 0 && days <= 14
  })

  const urgentPayments = upcomingPayments.filter((s) => getDaysUntil(s.due_date!) <= 3)

  const hasCards = (cards?.length ?? 0) > 0
  const hasStatements = currentMonthStatements.length > 0

  const currentMonthStatementIds = currentMonthStatements.map((s) => s.id)
  const { data: currentMonthTransactions } = currentMonthStatementIds.length
    ? await supabase
        .from('transactions')
        .select('*')
        .in('statement_id', currentMonthStatementIds)
    : { data: [] }

  const transactions = currentMonthTransactions ?? []

  const categoryTotals = new Map<string, number>()
  for (const t of transactions) {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount)
  }
  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
  const categoryTotal = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0)

  const topTransactions = transactions
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Finansal genel bakış</p>
        </div>
        <Link href="/statements/upload" className={cn(buttonVariants(), 'gap-2')}>
          <Plus className="w-4 h-4" />
          Ekstre Yükle
        </Link>
      </div>

      {/* Urgent alert */}
      {urgentPayments.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#EA580C' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#9A3412' }}>
              {urgentPayments.length} ödeme yaklaşıyor
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#C2410C' }}>
              {urgentPayments.map(s => `${s.card?.bank_name} **** ${s.card?.last_four_digits}`).join(', ')} — son ödeme tarihi 3 gün veya daha az
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="Bu Ay Toplam"
          value={hasStatements ? formatCurrency(totalThisMonth) : '—'}
          subtext={hasStatements ? `${currentMonthStatements.length} kart • ${MONTH_NAMES[prevMonth - 1]}'dan` : 'Ekstre bekleniyor'}
          delta={deltaPercent}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="blue"
        />
        <KPICard
          label="Aktif Kart"
          value={String(cards?.length ?? 0)}
          subtext={hasCards ? 'Takip edilen kart' : 'Henüz kart eklenmedi'}
          icon={<CreditCard className="w-4 h-4" />}
          accent="slate"
          href="/cards"
          linkLabel="Kartları yönet"
        />
        <KPICard
          label="Yaklaşan Ödeme"
          value={String(upcomingPayments.length)}
          subtext="14 gün içinde"
          icon={<AlertCircle className="w-4 h-4" />}
          accent={urgentPayments.length > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* No cards empty state */}
      {!hasCards && (
        <EmptyState
          icon={<CreditCard className="w-10 h-10" style={{ color: 'var(--blue-400)' }} />}
          title="Henüz kart eklemediniz"
          description="Kredi kartlarınızı ekleyerek ekstre takibine başlayın."
          action={
            <Link href="/cards/new" className={cn(buttonVariants(), 'gap-2')}>
              <Plus className="w-4 h-4" />
              İlk Kartı Ekle
            </Link>
          }
        />
      )}

      {/* Upcoming payments detail */}
      {upcomingPayments.length > 0 && (
        <Section title="Yaklaşan Ödemeler">
          <div className="divide-y divide-slate-100">
            {upcomingPayments.map((s) => {
              const days = getDaysUntil(s.due_date!)
              return (
                <PaymentRow
                  key={s.id}
                  bankName={s.card?.bank_name ?? ''}
                  cardName={s.card?.card_name ?? ''}
                  lastFour={s.card?.last_four_digits ?? ''}
                  dueDate={formatDate(s.due_date!)}
                  total={s.statement_total ?? 0}
                  days={days}
                />
              )
            })}
          </div>
        </Section>
      )}

      {/* Category breakdown + top transactions */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Kategori Dağılımı">
            <div className="py-2 space-y-3 pb-4">
              {categoryBreakdown.map(({ category, amount }) => {
                const pct = categoryTotal > 0 ? (amount / categoryTotal) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">{category}</p>
                      <p className="text-sm tabular-nums font-semibold text-slate-900">{formatCurrency(amount)}</p>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--slate-100)' }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, background: 'var(--blue-500)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title="En Büyük İşlemler">
            <div className="divide-y divide-slate-100">
              {topTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--slate-400)' }}>{t.category}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-slate-900">{formatCurrency(t.amount, t.currency)}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Cards with this month totals */}
      {hasCards && (
        <Section
          title="Kartlarım"
          action={<Link href="/cards" className="text-xs font-medium" style={{ color: 'var(--blue-600)' }}>Tümünü gör →</Link>}
        >
          <div className="divide-y divide-slate-100">
            {cards!.map((card) => {
              const stmt = currentMonthStatements.find(s => s.card_id === card.id)
              return (
                <div key={card.id} className="flex items-center justify-between py-3.5 px-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--blue-100)' }}
                    >
                      <CreditCard className="w-4 h-4" style={{ color: 'var(--blue-600)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{card.bank_name} — {card.card_name}</p>
                      <p className="text-xs tabular-nums" style={{ color: 'var(--slate-400)', fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>
                        **** **** **** {card.last_four_digits}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {stmt ? (
                      <>
                        <p className="text-sm font-bold tabular-nums text-slate-900">{formatCurrency(stmt.statement_total ?? 0)}</p>
                        {stmt.due_date && (
                          <p className="text-xs" style={{ color: 'var(--slate-400)' }}>
                            Son ödeme {formatDate(stmt.due_date)}
                          </p>
                        )}
                      </>
                    ) : (
                      <Link
                        href="/statements/upload"
                        className="text-xs font-medium flex items-center gap-1"
                        style={{ color: 'var(--blue-600)' }}
                      >
                        Ekstre yükle <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}

/* ── Sub-components ────────────────────────────────── */

function KPICard({
  label, value, subtext, delta, icon, accent, href, linkLabel,
}: {
  label: string
  value: string
  subtext: string
  delta?: number | null
  icon: React.ReactNode
  accent: 'blue' | 'slate' | 'red'
  href?: string
  linkLabel?: string
}) {
  const accentColors = {
    blue: { icon: 'var(--blue-100)', iconFg: 'var(--blue-600)' },
    slate: { icon: 'var(--slate-100)', iconFg: 'var(--slate-500)' },
    red: { icon: 'var(--red-100)', iconFg: 'var(--red-600)' },
  }
  const colors = accentColors[accent]

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-400)' }}>
          {label}
        </p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: colors.icon, color: colors.iconFg }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: 'var(--slate-400)' }}>{subtext}</p>
        {delta != null && (
          <span className={delta > 0 ? 'delta-negative' : delta < 0 ? 'delta-positive' : 'delta-neutral'}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {href && linkLabel && (
          <Link href={href} className="text-xs font-medium" style={{ color: 'var(--blue-600)' }}>
            {linkLabel} →
          </Link>
        )}
      </div>
    </div>
  )
}

function Section({
  title, children, action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        {action}
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function PaymentRow({
  bankName, cardName, lastFour, dueDate, total, days,
}: {
  bankName: string
  cardName: string
  lastFour: string
  dueDate: string
  total: number
  days: number
}) {
  const urgency = days === 0 ? 'red' : days <= 3 ? 'amber' : 'slate'
  const urgencyColors = {
    red: { bg: 'var(--red-100)', fg: 'var(--red-600)', label: 'Bugün' },
    amber: { bg: 'var(--amber-100)', fg: '#B45309', label: days === 1 ? 'Yarın' : `${days} gün` },
    slate: { bg: 'var(--slate-100)', fg: 'var(--slate-600)', label: `${days} gün` },
  }
  const colors = urgencyColors[urgency]

  return (
    <div className="flex items-center justify-between py-3.5 px-1">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {bankName} {cardName}
          <span className="font-normal ml-1.5 tabular-nums" style={{ color: 'var(--slate-400)' }}>
            **** {lastFour}
          </span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--slate-400)' }}>
          Son ödeme: {dueDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-bold tabular-nums text-slate-900">{formatCurrency(total)}</p>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: colors.bg, color: colors.fg }}
        >
          {colors.label}
        </span>
      </div>
    </div>
  )
}

function EmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed text-center"
      style={{ borderColor: 'var(--slate-200)' }}
    >
      <div className="mb-4">{icon}</div>
      <p className="text-base font-semibold text-slate-700 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{title}</p>
      <p className="text-sm mb-6" style={{ color: 'var(--slate-400)', maxWidth: '320px' }}>{description}</p>
      {action}
    </div>
  )
}
