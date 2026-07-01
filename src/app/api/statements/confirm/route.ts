import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toOverridePattern } from '@/lib/categorize'
import { CATEGORIES } from '@/lib/types'

export const runtime = 'nodejs'

type ConfirmTransaction = {
  transaction_date: string
  description: string
  amount: number
  currency: string
  category: string
  guessed_category?: string
  installment_info: string | null
  confidence_score: number
  raw_text: string
}

type ConfirmBody = {
  card_id: string
  period_month: number
  period_year: number
  statement_total: number | null
  minimum_payment: number | null
  due_date: string | null
  transactions: ConfirmTransaction[]
  overwrite?: boolean
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const body = (await request.json()) as ConfirmBody

  if (!body.card_id || !body.period_month || !body.period_year || !Array.isArray(body.transactions)) {
    return NextResponse.json({ error: 'Eksik veri.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('statements')
    .select('id')
    .eq('card_id', body.card_id)
    .eq('period_month', body.period_month)
    .eq('period_year', body.period_year)
    .maybeSingle()

  if (existing && !body.overwrite) {
    return NextResponse.json({ error: 'duplicate', message: 'Bu dönem için zaten ekstre yüklenmiş.' }, { status: 409 })
  }

  if (existing && body.overwrite) {
    const { error: deleteError } = await supabase.from('statements').delete().eq('id', existing.id)
    if (deleteError) {
      return NextResponse.json({ error: 'Eski ekstre silinemedi.' }, { status: 500 })
    }
  }

  const { data: statement, error: statementError } = await supabase
    .from('statements')
    .insert({
      user_id: user.id,
      card_id: body.card_id,
      period_month: body.period_month,
      period_year: body.period_year,
      statement_total: body.statement_total,
      minimum_payment: body.minimum_payment,
      due_date: body.due_date,
      processing_status: 'completed',
    })
    .select()
    .single()

  if (statementError || !statement) {
    return NextResponse.json({ error: 'Ekstre kaydedilemedi.' }, { status: 500 })
  }

  const validCategories = new Set<string>(CATEGORIES)
  const overridesToUpsert = new Map<string, string>()

  const rows = body.transactions.map((t) => {
    const category = validCategories.has(t.category) ? t.category : 'Diğer'
    if (t.guessed_category && t.guessed_category !== category) {
      overridesToUpsert.set(toOverridePattern(t.description), category)
    }
    return {
      statement_id: statement.id,
      user_id: user.id,
      transaction_date: t.transaction_date,
      description: t.description,
      amount: t.amount,
      currency: t.currency || 'TRY',
      category,
      installment_info: t.installment_info,
      confidence_score: t.confidence_score,
      raw_text: t.raw_text,
    }
  })

  if (rows.length > 0) {
    const { error: txError } = await supabase.from('transactions').insert(rows)
    if (txError) {
      await supabase.from('statements').delete().eq('id', statement.id)
      return NextResponse.json({ error: 'İşlemler kaydedilemedi.' }, { status: 500 })
    }
  }

  if (overridesToUpsert.size > 0) {
    const overrideRows = Array.from(overridesToUpsert.entries()).map(([description_pattern, category]) => ({
      user_id: user.id,
      description_pattern,
      category,
    }))
    await supabase.from('category_overrides').upsert(overrideRows, { onConflict: 'user_id,description_pattern' })
  }

  return NextResponse.json({ statement_id: statement.id })
}
