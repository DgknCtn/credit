import pdfParse from 'pdf-parse'

export type ParsedTransaction = {
  transaction_date: string // ISO yyyy-mm-dd
  description: string
  amount: number
  currency: string
  installment_info: string | null
  confidence_score: number
  raw_text: string
}

export type ParsedStatement = {
  transactions: ParsedTransaction[]
  statement_total: number | null
  minimum_payment: number | null
  due_date: string | null
  period_month: number | null
  period_year: number | null
  raw_text_length: number
}

const DATE_RE = /(\d{2})[.\/](\d{2})[.\/](\d{2,4})/
const AMOUNT_RE = /(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*(TL|TRY|USD|EUR|\$|€)?/
const INSTALLMENT_RE = /(\d{1,2})\s*[\/\\]\s*(\d{1,2})\s*(?:TAKS[İI]T)?|TAKS[İI]T\s*[:.]?\s*(\d{1,2})\s*[\/\\]\s*(\d{1,2})/i

// A transaction line: date, description, amount (optionally with currency), at line end.
const LINE_RE = new RegExp(
  `^\\s*${DATE_RE.source}\\s+(.+?)\\s+${AMOUNT_RE.source}\\s*$`
)

function normalizeYear(y: string): number {
  const n = Number(y)
  return n < 100 ? 2000 + n : n
}

function toIsoDate(dd: string, mm: string, yyyy: string): string {
  const year = normalizeYear(yyyy)
  return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/\./g, '').replace(',', '.'))
}

function normalizeCurrency(raw?: string): string {
  if (!raw) return 'TRY'
  const r = raw.toUpperCase()
  if (r === 'TL' || r === 'TRY') return 'TRY'
  if (r === '$') return 'USD'
  if (r === '€') return 'EUR'
  return r
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  return result.text
}

export function parseStatementText(text: string): ParsedStatement {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const transactions: ParsedTransaction[] = []
  let statement_total: number | null = null
  let minimum_payment: number | null = null
  let due_date: string | null = null
  let period_month: number | null = null
  let period_year: number | null = null

  for (const line of lines) {
    // Skip obvious header/footer noise
    const lower = line.toLocaleLowerCase('tr-TR')

    const totalMatch = /(toplam\s*bor[çc]|d[öo]nem\s*bor[çc]u|hesap\s*[öo]zeti\s*tutar[ıi]?)/i.test(line)
      ? line.match(AMOUNT_RE)
      : null
    if (totalMatch && statement_total === null) {
      statement_total = parseAmount(totalMatch[1])
      continue
    }

    const minMatch = /asgari\s*[öo]deme/i.test(line) ? line.match(AMOUNT_RE) : null
    if (minMatch && minimum_payment === null) {
      minimum_payment = parseAmount(minMatch[1])
      continue
    }

    const dueMatch = /son\s*[öo]deme\s*tarih/i.test(line) ? line.match(DATE_RE) : null
    if (dueMatch && due_date === null) {
      due_date = toIsoDate(dueMatch[1], dueMatch[2], dueMatch[3])
      continue
    }

    if (/hesap\s*kesim\s*tarih/i.test(line) && period_month === null) {
      const m = line.match(DATE_RE)
      if (m) {
        period_month = Number(m[2])
        period_year = normalizeYear(m[3])
      }
    }

    if (
      /^(sayfa|page|toplam|ara\s*toplam|devir|bakiye|iban|müşteri|musteri|hesap\s*no)/i.test(lower)
    ) {
      continue
    }

    const match = line.match(LINE_RE)
    if (!match) continue

    const [, dd, mm, yyyy, descRaw, amountRaw, currencyRaw] = match
    const installmentMatch = descRaw.match(INSTALLMENT_RE)
    const installment_info = installmentMatch
      ? `${installmentMatch[1] ?? installmentMatch[3]}/${installmentMatch[2] ?? installmentMatch[4]}`
      : null

    const description = descRaw.replace(INSTALLMENT_RE, '').replace(/\s{2,}/g, ' ').trim()
    if (!description) continue

    const amount = parseAmount(amountRaw)
    if (Number.isNaN(amount) || amount === 0) continue

    let confidence_score = 1.0
    if (!/^[A-ZÇĞİÖŞÜ0-9]/.test(description)) confidence_score -= 0.2
    if (description.length < 3) confidence_score -= 0.3
    confidence_score = Math.max(0.3, Math.min(1, confidence_score))

    transactions.push({
      transaction_date: toIsoDate(dd, mm, yyyy),
      description,
      amount,
      currency: normalizeCurrency(currencyRaw),
      installment_info,
      confidence_score,
      raw_text: line,
    })

    if (period_month === null) {
      period_month = Number(mm)
      period_year = normalizeYear(yyyy)
    }
  }

  return {
    transactions,
    statement_total,
    minimum_payment,
    due_date,
    period_month,
    period_year,
    raw_text_length: text.length,
  }
}
