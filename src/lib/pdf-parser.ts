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

const NUMERIC_DATE_RE = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/
const TEXT_DATE_RE = /(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/

// Bonus/Garanti-style tail: an optional small "bonus" figure glued directly
// onto the real amount with no separator, then the amount, then an optional
// +/- suffix marking a payment/credit rather than a purchase.
const END_ANCHORED_AMOUNT_RE = /(?:\d{1,2},\d{2})?(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*([+-])?\s*$/

// Bonus-style installment breakdown glued into the description, e.g.
// "1.932,83x6=11.597,00 2.Taksit" (per-installment x count = total, current.Taksit)
const BONUS_INSTALLMENT_RE = /\d[\d.]*,\d{2}x(\d+)=[\d.]+,\d{2}\s*(\d+)\.Taksit/i

// Yapı Kredi (Worldcard/Play)-style: amount is the FIRST number after the
// merchant name, optionally prefixed with +/-; anything after (remaining
// balance / puan columns) is glued on with no separator and discarded.
const START_ANCHORED_AMOUNT_RE = /^(.*?)([+-])?(\d{1,3}(?:\.\d{3})*,\d{2})/

// Yapı Kredi installment detail appears on the line *after* the transaction:
// "15.499,00 TL'lik işlemin 5 / 6 taksidi"
const YAPIKREDI_INSTALLMENT_RE = /^[\d.]+,\d{2}\s*TL'lik\s*işlemin\s*(\d+)\s*\/\s*(\d+)\s*taksidi/i

const HEADER_SKIP_RE = /^(sayfa|page|toplam|ara\s*toplam|devir|bakiye|iban|müşteri|musteri|hesap\s*no|ekstre\s*no|ekstre\s*sayfası)/i

type BankFormat = 'bonus' | 'yapikredi' | 'generic'

function detectBankFormat(text: string): BankFormat {
  if (/worldpuan|yapı\s*(ve\s*)?kredi\s*bankası|İşlem\s*Tarihi\s*İşlemler\s*Tutar/i.test(text)) return 'yapikredi'
  if (/bonus\s*(program|trink)|garanti\s*bbva/i.test(text)) return 'bonus'
  return 'generic'
}

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
// ("20 Haziran 2026" / "3 Haziran 2026").
function extractDate(text: string): string | null {
  const textMatch = text.match(TEXT_DATE_RE)
  if (textMatch) {
    const month = TURKISH_MONTHS[normalizeMonthName(textMatch[2])]
    if (month) return toIsoDate(textMatch[1], month, textMatch[3])
  }
  const numeric = text.match(NUMERIC_DATE_RE)
  if (numeric) return toIsoDate(numeric[1], Number(numeric[2]), numeric[3])
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

function cleanDescription(raw: string): string {
  return raw
    .replace(/\d{1,3}(?:\.\d{3})*,\d{2}\s*(TL|USD|EUR)?\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  return result.text
}

export function parseStatementText(text: string): ParsedStatement {
  const format = detectBankFormat(text)
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Some banks split "Hesap Kesim Tarihi" / ":" / "14 Haziran 2026" across
    // separate lines — look a couple of lines ahead when the value isn't
    // inline with the label.
    const lookahead = [line, lines[i + 1], lines[i + 2]].filter(Boolean).join(' ')

    if (
      statement_total === null &&
      /(toplam\s*bor[çc]|d[öo]nem\s*bor[çc]u|hesap\s*[öo]zeti\s*tutar[ıi]?)/i.test(line)
    ) {
      const m = lookahead.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)
      if (m) {
        statement_total = parseAmount(m[1])
        continue
      }
    }

    if (
      minimum_payment === null &&
      /(asgari\s*[öo]deme|asgari\s*tutar|min\.?\s*[öo]deme)/i.test(line)
    ) {
      const m = lookahead.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)
      if (m) {
        minimum_payment = parseAmount(m[1])
        continue
      }
    }

    if (due_date === null && /son\s*[öo]deme\s*tarih/i.test(line)) {
      const d = extractDate(lookahead)
      if (d) {
        due_date = d
        continue
      }
    }

    if (period_month === null && /hesap\s*kesim\s*tarih/i.test(line)) {
      const d = extractDate(lookahead)
      if (d) {
        const [y, m] = d.split('-')
        period_year = Number(y)
        period_month = Number(m)
        continue
      }
    }

    if (HEADER_SKIP_RE.test(line)) continue

    const dateMatch = matchTransactionLine(line)
    if (!dateMatch) continue

    let description: string
    let amountRaw: string
    let sign: string | undefined
    let installment_info: string | null = null

    if (format === 'yapikredi') {
      const m = dateMatch.rest.match(START_ANCHORED_AMOUNT_RE)
      if (!m) continue
      description = cleanDescription(m[1]).replace(/\s+[A-ZÇĞİÖŞÜ]{2,3}\s*$/, '').trim()
      sign = m[2]
      amountRaw = m[3]

      const nextLineInstallment = lines[i + 1]?.match(YAPIKREDI_INSTALLMENT_RE)
      if (nextLineInstallment) {
        installment_info = `${nextLineInstallment[1]}/${nextLineInstallment[2]}`
      }
    } else {
      const tailMatch = dateMatch.rest.match(END_ANCHORED_AMOUNT_RE)
      if (!tailMatch) continue
      amountRaw = tailMatch[1]
      sign = tailMatch[2]
      const beforeTail = dateMatch.rest.slice(0, dateMatch.rest.length - tailMatch[0].length)

      const installmentMatch = beforeTail.match(BONUS_INSTALLMENT_RE)
      installment_info = installmentMatch ? `${installmentMatch[2]}/${installmentMatch[1]}` : null
      description = cleanDescription(installmentMatch ? beforeTail.replace(BONUS_INSTALLMENT_RE, '') : beforeTail)
    }

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
