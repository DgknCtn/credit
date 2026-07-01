import { CardForm } from '@/components/cards/card-form'

export default function NewCardPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Yeni Kart Ekle</h1>
      <CardForm />
    </div>
  )
}
