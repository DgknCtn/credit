import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CategoryRules } from '@/components/settings/category-rules'

export default async function CategoryRulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rules } = await supabase
    .from('category_overrides')
    .select('id, description_pattern, category')
    .order('description_pattern')

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: 'var(--blue-600)' }}>
          <ArrowLeft className="w-4 h-4" />
          Ayarlara dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Kategori Kuralları</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bir işlemin kategorisini düzelttiğinizde burada bir kural oluşur ve aynı işyerinden
          gelecek sonraki işlemler otomatik olarak bu kategoriye atanır.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CategoryRules rules={rules ?? []} />
      </div>
    </div>
  )
}
