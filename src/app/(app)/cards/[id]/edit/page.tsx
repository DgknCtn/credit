import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CardForm } from '@/components/cards/card-form'

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: card } = await supabase.from('cards').select('*').eq('id', id).single()
  if (!card) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Kartı Düzenle</h1>
      <CardForm card={card} />
    </div>
  )
}
