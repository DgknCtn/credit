import type { Category } from '@/lib/types'

type Rule = { category: Category; keywords: string[] }

// Ordered rule set — first match wins. Keep specific brands before generic terms.
const RULES: Rule[] = [
  {
    category: 'Market',
    keywords: [
      'migros', 'carrefour', 'carrefoursa', 'a101', 'bim', 'şok', 'sok market',
      'metro market', 'macrocenter', 'file market', 'happycenter', 'tarım kredi',
    ],
  },
  {
    category: 'Yemek',
    keywords: [
      'yemeksepeti', 'getir yemek', 'trendyol yemek', 'restoran', 'restaurant',
      'cafe', 'kafe', 'kahve', 'starbucks', 'burger', 'pizza', 'lokanta', 'kebap',
      'kokoreç', 'fırın', 'firin', 'ekmek', 'pastane', 'bakery', 'simit',
    ],
  },
  {
    category: 'Ulaşım',
    keywords: [
      'shell', 'opet', 'bp ', 'petrol ofisi', 'total ', 'akaryakıt', 'otopark',
      'ist card', 'istanbulkart', 'metro istanbul', 'taksi', 'bitaksi', 'uber',
      'havaş', 'otoyol', 'hgs', 'ogs',
    ],
  },
  {
    category: 'Fatura',
    keywords: [
      'türk telekom', 'turkcell', 'vodafone', 'elektrik', 'igdas', 'iski',
      'aski', 'doğalgaz', 'fatura', 'baskent edas', 'enerjisa',
    ],
  },
  {
    category: 'Abonelik',
    keywords: [
      'netflix', 'spotify', 'youtube', 'apple.com/bill', 'google play',
      'amazon prime', 'exxen', 'blutv', 'gain', 'icloud', 'disney+', 'playstation',
      'xbox', 'chatgpt', 'openai', 'claude.ai', 'anthropic',
    ],
  },
  {
    category: 'Alışveriş',
    keywords: [
      'trendyol', 'hepsiburada', 'amazon', 'n11', 'lcw', 'lc waikiki', 'zara',
      'h&m', 'defacto', 'koton', 'mediamarkt', 'teknosa', 'vatan bilgisayar',
      'ikea',
    ],
  },
  {
    category: 'Sağlık',
    keywords: [
      'eczane', 'pharmacy', 'hastane', 'hastanesi', 'medical', 'diş', 'klinik',
      'sağlık',
    ],
  },
  {
    category: 'Eğitim',
    keywords: ['udemy', 'coursera', 'okul', 'üniversite', 'kurs', 'dersane', 'kitap'],
  },
  {
    category: 'Seyahat',
    keywords: [
      'thy', 'turkish airlines', 'pegasus', 'booking.com', 'airbnb', 'otel',
      'hotel', 'jollibee', 'obilet', 'enterprise rent',
    ],
  },
  {
    category: 'Eğlence',
    keywords: ['sinema', 'cinema', 'biletix', 'passo', 'konser', 'tiyatro'],
  },
  {
    category: 'Nakit / Finansal İşlemler',
    keywords: [
      'nakit avans', 'atm', 'para transferi', 'havale', 'eft', 'kredi kartı ödemesi',
      'faiz', 'bsmv', 'komisyon', 'ödemeniz için teşekkür', 'ödemenize teşekkür',
    ],
  },
]

function normalize(text: string): string {
  // Plain toLowerCase(), not the tr-TR locale variant — the Turkish locale
  // maps "I" -> "ı" (dotless), which breaks matches against ASCII brand
  // keywords like "apple.com/bill" (would become "bıll").
  return text.replace(/İ/g, 'i').toLowerCase()
}

export function guessCategory(description: string): Category {
  const normalized = normalize(description)
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.category
    }
  }
  return 'Diğer'
}

export type CategoryOverride = { description_pattern: string; category: string }

// User corrections take priority over keyword rules. A pattern matches if it
// appears as a substring of the (normalized) transaction description.
export function categorizeWithOverrides(
  description: string,
  overrides: CategoryOverride[]
): Category {
  const normalized = normalize(description)
  const hit = overrides.find((o) => normalized.includes(normalize(o.description_pattern)))
  if (hit) return hit.category as Category
  return guessCategory(description)
}

// Pattern stored for future matches: the significant leading part of the
// description (merchant name), so slightly different suffixes still match.
export function toOverridePattern(description: string): string {
  return description.trim().slice(0, 24).trim()
}
