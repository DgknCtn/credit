import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'
import { formatCurrency } from '@/lib/utils-app'

export const runtime = 'nodejs'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: statements } = await supabase
    .from('statements')
    .select('id, user_id, card_id, due_date, statement_total, card:cards(bank_name, card_name, last_four_digits)')
    .eq('processing_status', 'completed')
    .gte('due_date', today)
    .lte('due_date', inThreeDays)

  if (!statements || statements.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0 })
  }

  const userIds = Array.from(new Set(statements.map((s) => s.user_id)))
  const { data: settingsRows } = await supabase
    .from('notification_settings')
    .select('user_id, telegram_chat_id, reminder_days, is_enabled')
    .in('user_id', userIds)
    .eq('is_enabled', true)
    .not('telegram_chat_id', 'is', null)

  const settingsByUser = new Map((settingsRows ?? []).map((s) => [s.user_id, s]))

  let sent = 0
  for (const statement of statements) {
    const settings = settingsByUser.get(statement.user_id)
    if (!settings || !statement.due_date) continue

    const days = daysUntil(statement.due_date)
    if (!settings.reminder_days.includes(days)) continue

    const { data: alreadySent } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('statement_id', statement.id)
      .eq('status', 'sent')
      .gte('sent_at', `${today}T00:00:00Z`)
      .maybeSingle()
    if (alreadySent) continue

    const card = statement.card as unknown as { bank_name: string; card_name: string; last_four_digits: string } | null
    const dayLabel = days === 0 ? 'bugün' : days === 1 ? 'yarın' : `${days} gün sonra`
    const totalLabel = statement.statement_total != null ? formatCurrency(statement.statement_total) : 'bilinmiyor'
    const text = `${card?.bank_name ?? ''} ${card?.card_name ?? ''} **** ${card?.last_four_digits ?? ''} kartının son ödeme tarihi ${dayLabel}. Dönem borcu: ${totalLabel}.`

    let status: 'sent' | 'failed' = 'sent'
    let errorMessage: string | null = null
    try {
      const ok = await sendTelegramMessage(settings.telegram_chat_id!, text)
      if (!ok) {
        status = 'failed'
        errorMessage = 'Telegram API isteği başarısız oldu.'
      } else {
        sent++
      }
    } catch (err) {
      status = 'failed'
      errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata.'
    }

    await supabase.from('notification_logs').insert({
      user_id: statement.user_id,
      card_id: statement.card_id,
      statement_id: statement.id,
      status,
      error_message: errorMessage,
    })
  }

  return NextResponse.json({ sent, checked: statements.length })
}
