'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { LogoMark } from '@/components/brand/logo-mark'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--slate-50)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--navy-900)' }}
          >
            <LogoMark size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Hesap oluşturun
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--slate-400)' }}>
            Ekstre takibine hemen başlayın
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                autoComplete="email"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slate-500)' }}>
                Şifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--slate-400)' }}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--slate-400)' }}>En az 6 karakter</p>
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'var(--red-100)', color: 'var(--red-600)' }}
                role="alert"
              >
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--slate-500)' }}>
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--blue-600)' }}>
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
