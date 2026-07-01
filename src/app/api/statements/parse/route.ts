import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPdfText, parseStatementText } from '@/lib/pdf-parser'
import { categorizeWithOverrides } from '@/lib/categorize'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const cardId = formData.get('card_id')

  if (!(file instanceof File) || typeof cardId !== 'string' || !cardId) {
    return NextResponse.json({ error: 'PDF dosyası ve kart seçimi gerekli.' }, { status: 400 })
  }

  const { data: card } = await supabase
    .from('cards')
    .select('id')
    .eq('id', cardId)
    .single()
  if (!card) return NextResponse.json({ error: 'Kart bulunamadı.' }, { status: 404 })

  let text: string
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    text = await extractPdfText(buffer)
  } catch {
    return NextResponse.json({ error: 'PDF metni çıkarılamadı.' }, { status: 422 })
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'PDF metni çıkarılamadı.' }, { status: 422 })
  }

  const parsed = parseStatementText(text)

  const { data: overrides } = await supabase
    .from('category_overrides')
    .select('description_pattern, category')

  const transactions = parsed.transactions.map((t) => ({
    ...t,
    category: categorizeWithOverrides(t.description, overrides ?? []),
  }))

  let duplicate = false
  if (parsed.period_month && parsed.period_year) {
    const { data: existing } = await supabase
      .from('statements')
      .select('id')
      .eq('card_id', cardId)
      .eq('period_month', parsed.period_month)
      .eq('period_year', parsed.period_year)
      .maybeSingle()
    duplicate = !!existing
  }

  return NextResponse.json({
    transactions,
    statement_total: parsed.statement_total,
    minimum_payment: parsed.minimum_payment,
    due_date: parsed.due_date,
    period_month: parsed.period_month,
    period_year: parsed.period_year,
    duplicate,
    low_confidence_count: transactions.filter((t) => t.confidence_score < 0.7).length,
  })
}
