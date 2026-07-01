import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TelegramSettings } from '@/components/settings/telegram-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('id, telegram_chat_id, reminder_days, is_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bildirim tercihlerinizi yönetin.</p>
      </div>
      <TelegramSettings
        userId={user.id}
        initialSettings={settings ?? null}
        botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
      />
    </div>
  )
}
