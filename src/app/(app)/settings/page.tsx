import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Tag } from 'lucide-react'
import { TelegramSettings } from '@/components/settings/telegram-settings'
import { BudgetSettings } from '@/components/settings/budget-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: settings }, { data: budgets }] = await Promise.all([
    supabase
      .from('notification_settings')
      .select('id, telegram_chat_id, reminder_days, is_enabled')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('category_budgets')
      .select('category, monthly_limit')
      .eq('user_id', user.id),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bildirim tercihlerinizi yönetin.</p>
      </div>
      <TelegramSettings
        userId={user.id}
        initialSettings={settings ?? null}
        botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
      />

      <BudgetSettings userId={user.id} initialBudgets={budgets ?? []} />

      <Link
        href="/settings/categories"
        className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--blue-100)' }}>
            <Tag className="w-5 h-5" style={{ color: 'var(--blue-600)' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Kategori Kuralları</h2>
            <p className="text-xs" style={{ color: 'var(--slate-400)' }}>
              Öğrenilmiş işyeri → kategori eşleşmelerini yönetin.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--slate-400)' }} />
      </Link>
    </div>
  )
}
