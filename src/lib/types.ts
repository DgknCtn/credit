export type Card = {
  id: string
  user_id: string
  bank_name: string
  card_name: string
  last_four_digits: string
  statement_day: number
  payment_due_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Statement = {
  id: string
  user_id: string
  card_id: string
  period_month: number
  period_year: number
  statement_total: number | null
  minimum_payment: number | null
  due_date: string | null
  uploaded_at: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  card?: Card
}

export type Transaction = {
  id: string
  statement_id: string
  user_id: string
  transaction_date: string
  description: string
  amount: number
  currency: string
  category: string
  user_category: string | null
  installment_info: string | null
  confidence_score: number
  raw_text: string | null
  created_at: string
}

export const CATEGORIES = [
  'Market',
  'Yemek',
  'Ulaşım',
  'Fatura',
  'Abonelik',
  'Alışveriş',
  'Sağlık',
  'Eğitim',
  'Seyahat',
  'Eğlence',
  'Nakit / Finansal İşlemler',
  'Diğer',
] as const

export type Category = (typeof CATEGORIES)[number]

export type NotificationSettings = {
  id: string
  user_id: string
  telegram_chat_id: string | null
  reminder_days: number[]
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export type CategoryBudget = {
  id: string
  user_id: string
  category: string
  monthly_limit: number
  created_at: string
  updated_at: string
}
