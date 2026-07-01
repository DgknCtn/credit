'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { generateLinkCode } from '@/lib/link-code'
import { Button } from '@/components/ui/button'
import { Send, CheckCircle2, Unlink } from 'lucide-react'

type Settings = {
  id: string
  telegram_chat_id: string | null
  reminder_days: number[]
  is_enabled: boolean
} | null

const REMINDER_OPTIONS = [
  { value: 3, label: '3 gün önce' },
  { value: 1, label: '1 gün önce' },
  { value: 0, label: 'Ödeme günü' },
]

export function TelegramSettings({
  userId, initialSettings, botUsername,
}: {
  userId: string
  initialSettings: Settings
  botUsername: string | null
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isLinked = !!settings?.telegram_chat_id

  async function handleGenerateCode() {
    setLoading(true)
    const newCode = generateLinkCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(
        { user_id: userId, link_code: newCode, link_code_expires_at: expiresAt },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      toast.error('Kod oluşturulamadı.')
    } else {
      setSettings(data)
      setCode(newCode)
    }
    setLoading(false)
  }

  async function handleUnlink() {
    if (!settings) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('notification_settings')
      .update({ telegram_chat_id: null, is_enabled: false })
      .eq('id', settings.id)

    if (error) {
      toast.error('Bağlantı kaldırılamadı.')
    } else {
      setSettings({ ...settings, telegram_chat_id: null, is_enabled: false })
      toast.success('Telegram bağlantısı kaldırıldı.')
    }
    setLoading(false)
  }

  async function toggleReminderDay(day: number) {
    if (!settings) return
    const days = settings.reminder_days.includes(day)
      ? settings.reminder_days.filter((d) => d !== day)
      : [...settings.reminder_days, day]

    const supabase = createClient()
    const { error } = await supabase
      .from('notification_settings')
      .update({ reminder_days: days })
      .eq('id', settings.id)

    if (!error) setSettings({ ...settings, reminder_days: days })
  }

  async function toggleEnabled() {
    if (!settings) return
    const supabase = createClient()
    const { error } = await supabase
      .from('notification_settings')
      .update({ is_enabled: !settings.is_enabled })
      .eq('id', settings.id)

    if (!error) setSettings({ ...settings, is_enabled: !settings.is_enabled })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--blue-100)' }}>
          <Send className="w-5 h-5" style={{ color: 'var(--blue-600)' }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Telegram Bildirimleri</h2>
          <p className="text-xs" style={{ color: 'var(--slate-400)' }}>
            Son ödeme tarihi yaklaşınca Telegram&apos;dan hatırlatma alın.
          </p>
        </div>
      </div>

      {isLinked ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F0FDF4' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
            <p className="text-sm font-medium" style={{ color: '#15803D' }}>Telegram bağlı</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
              Hatırlatma Zamanlaması
            </p>
            <div className="flex gap-2 flex-wrap">
              {REMINDER_OPTIONS.map((opt) => {
                const active = settings!.reminder_days.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleReminderDay(opt.value)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={active
                      ? { background: 'var(--blue-600)', color: 'white', borderColor: 'var(--blue-600)' }
                      : { background: 'white', color: 'var(--slate-600)', borderColor: 'var(--slate-200)' }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-700">Hatırlatmalar {settings!.is_enabled ? 'açık' : 'kapalı'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleEnabled} disabled={loading}>
              {settings!.is_enabled ? 'Kapat' : 'Aç'}
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleUnlink} disabled={loading} className="gap-1.5 text-red-600 hover:text-red-600">
            <Unlink className="w-3.5 h-3.5" />
            Bağlantıyı Kaldır
          </Button>
        </>
      ) : code ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--slate-600)' }}>
            {botUsername ? (
              <>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium"
                  style={{ color: 'var(--blue-600)' }}
                >
                  @{botUsername}
                </a>
                {' '}botuna aşağıdaki komutu gönderin:
              </>
            ) : (
              'Bot kullanıcı adınıza aşağıdaki komutu gönderin:'
            )}
          </p>
          <code className="block text-center text-lg font-mono font-bold tracking-widest py-3 rounded-lg" style={{ background: 'var(--slate-100)' }}>
            /start {code}
          </code>
          <p className="text-xs" style={{ color: 'var(--slate-400)' }}>
            Kod 10 dakika geçerlidir. Bağlantı sağlanınca bu sayfayı yenileyin.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Bağlantıyı Kontrol Et
          </Button>
        </div>
      ) : (
        <Button onClick={handleGenerateCode} disabled={loading} className="gap-2">
          {loading ? 'Oluşturuluyor...' : 'Telegram Bağla'}
        </Button>
      )}
    </div>
  )
}
