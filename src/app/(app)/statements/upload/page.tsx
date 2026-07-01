import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadForm } from '@/components/statements/upload-form'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cards } = await supabase
    .from('cards')
    .select('id, bank_name, card_name, last_four_digits')
    .eq('is_active', true)
    .order('created_at')

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ekstre Yükle</h1>
        <p className="text-sm text-slate-500 mt-0.5">Kartınızı seçin, PDF ekstreyi yükleyin ve işlemleri onaylayın.</p>
      </div>
      <UploadForm cards={cards ?? []} />
    </div>
  )
}
