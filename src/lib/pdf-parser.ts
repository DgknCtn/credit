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

const TURKISH_MONTHS: Record<string, number> = {
  ocak: 1, şubat: 2, subat: 2, mart: 3, nisan: 4, mayıs: 5, mayis: 5,
  haziran: 6, temmuz: 7, ağustos: 8, agustos: 8, eylül: 9, eylul: 9,
  ekim: 10, kasım: 11, kasim: 11, aralık: 12, aralik: 12,
}

const NUMERIC_DATE_RE = /(\d{2})[.\/](\d{2})[.\/](\d{2,4})/
const TEXT_DATE_RE = /(\d{2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/

// Tail of a transaction line: an optional small "bonus" figure glued directly
// onto the real amount with no separator (some banks — e.g. Garanti Bonus —
// concatenate table columns with no whitespace), then the amount itself, then
// an optional +/- suffix marking a payment/credit rather than a purchase.
const AMOUNT_TAIL_RE = /(?:\d{1,2},\d{2})?(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*([+-])?\s*$/

// Installment breakdown glued into the description, e.g.
// "1.932,83x6=11.597,00 2.Taksit" (per-installment x count = total, current.Taksit)
const INSTALLMENT_RE = /\d[\d.]*,\d{2}x(\d+)=[\d.]+,\d{2}\s*(\d+)\.Taksit/i

function normalizeYear(y: string): number {
  const n = Number(y)
  return n < 100 ? 2000 + n : n
}

function normalizeMonthName(raw: string): string {
  return raw.toLocaleLowerCase('tr-TR').replace(/i̇/g, 'i')
}

function toIsoDate(dd: string, month: number, yyyy: string): string {
  return `${normalizeYear(yyyy)}-${String(month).padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/\./g, '').replace(',', '.'))
}

// Turkish banks export dates either numerically ("20.06.2026") or spelled out
// ("20 Haziran 2026"). Tries both.
function extractDate(line: string): string | null {
  const numeric = line.match(NUMERIC_DATE_RE)
  if (numeric) return toIsoDate(numeric[1], Number(numeric[2]), numeric[3])

  const text = line.match(TEXT_DATE_RE)
  if (text) {
    const month = TURKISH_MONTHS[normalizeMonthName(text[2])]
    if (month) return toIsoDate(text[1], month, text[3])
  }
  return null
}

type LineDate = { day: string; month: number; year: string; rest: string }

function matchTransactionLine(line: string): LineDate | null {
  const textMatch = line.match(new RegExp(`^${TEXT_DATE_RE.source}(.+)$`))
  if (textMatch) {
    const month = TURKISH_MONTHS[normalizeMonthName(textMatch[2])]
    if (month) return { day: textMatch[1], month, year: textMatch[3], rest: textMatch[4] }
  }

  const numericMatch = line.match(new RegExp(`^${NUMERIC_DATE_RE.source}\\s+(.+)$`))
  if (numericMatch) {
    return { day: numericMatch[1], month: Number(numericMatch[2]), year: numericMatch[3], rest: numericMatch[4] }
  }

  return null
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
    if (
      statement_total === null &&
      /(toplam\s*bor[çc]|d[öo]nem\s*bor[çc]u|hesap\s*[öo]zeti\s*tutar[ıi]?)/i.test(line)
    ) {
      const m = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)
      if (m) {
        statement_total = parseAmount(m[1])
        continue
      }
    }

    if (minimum_payment === null && /(asgari\s*[öo]deme|min\.?\s*[öo]deme)/i.test(line)) {
      const m = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)
      if (m) {
        minimum_payment = parseAmount(m[1])
        continue
      }
    }

    if (due_date === null && /son\s*[öo]deme\s*tarih/i.test(line)) {
      const d = extractDate(line)
      if (d) {
        due_date = d
        continue
      }
    }

    if (period_month === null && /hesap\s*kesim\s*tarih/i.test(line)) {
      const d = extractDate(line)
      if (d) {
        const [y, m] = d.split('-')
        period_year = Number(y)
        period_month = Number(m)
        continue
      }
    }

    if (/^(sayfa|page|toplam|ara\s*toplam|devir|bakiye|iban|müşteri|musteri|hesap\s*no|ekstre\s*no|ekstre\s*sayfası)/i.test(line)) {
      continue
    }

    const dateMatch = matchTransactionLine(line)
    if (!dateMatch) continue

    const tailMatch = dateMatch.rest.match(AMOUNT_TAIL_RE)
    if (!tailMatch) continue

    const amountRaw = tailMatch[1]
    const sign = tailMatch[2]
    const beforeTail = dateMatch.rest.slice(0, dateMatch.rest.length - tailMatch[0].length)

    const installmentMatch = beforeTail.match(INSTALLMENT_RE)
    const installment_info = installmentMatch ? `${installmentMatch[2]}/${installmentMatch[1]}` : null

    const description = (installmentMatch ? beforeTail.replace(INSTALLMENT_RE, '') : beforeTail)
      .replace(/\d{1,3}(?:\.\d{3})*,\d{2}\s*(TL|USD|EUR)?\s*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (!description || description.length < 2) continue

    const magnitude = parseAmount(amountRaw)
    if (Number.isNaN(magnitude) || magnitude === 0) continue
    const amount = sign ? -Math.abs(magnitude) : magnitude

    let confidence_score = 1.0
    if (description.length < 4) confidence_score -= 0.2
    if (sign) confidence_score -= 0.1
    confidence_score = Math.max(0.3, Math.min(1, confidence_score))

    transactions.push({
      transaction_date: toIsoDate(dateMatch.day, dateMatch.month, dateMatch.year),
      description,
      amount,
      currency: 'TRY',
      installment_info,
      confidence_score,
      raw_text: line,
    })

    if (period_month === null) {
      period_month = dateMatch.month
      period_year = normalizeYear(dateMatch.year)
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
