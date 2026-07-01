import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

type TelegramUpdate = {
  message?: {
    chat: { id: number }
    text?: string
  }
}

export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate
  const message = update.message
  if (!message?.text) return NextResponse.json({ ok: true })

  const match = message.text.trim().match(/^\/start\s+([A-Z0-9]{6})$/i)
  if (!match) {
    await sendTelegramMessage(String(message.chat.id), 'Merhaba! Uygulamadaki Ayarlar sayfasından aldığınız bağlantı kodunu /start KOD şeklinde gönderin.')
    return NextResponse.json({ ok: true })
  }

  const code = match[1].toUpperCase()
  const supabase = createAdminClient()

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('id, link_code_expires_at')
    .eq('link_code', code)
    .maybeSingle()

  if (!settings || !settings.link_code_expires_at || new Date(settings.link_code_expires_at) < new Date()) {
    await sendTelegramMessage(String(message.chat.id), 'Bu kod geçersiz veya süresi dolmuş. Uygulamadan yeni bir kod alın.')
    return NextResponse.json({ ok: true })
  }

  await supabase
    .from('notification_settings')
    .update({
      telegram_chat_id: String(message.chat.id),
      is_enabled: true,
      link_code: null,
      link_code_expires_at: null,
    })
    .eq('id', settings.id)

  await sendTelegramMessage(String(message.chat.id), 'Bağlantı başarılı! Artık ödeme hatırlatmalarınız buradan gelecek.')

  return NextResponse.json({ ok: true })
}
