import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/brand/logo-mark'
import { CardPreviewMock } from '@/components/brand/card-preview-mock'
import { Upload, Shield, Bell, BarChart3 } from 'lucide-react'

const features = [
  { icon: Upload, title: 'Ekstre Takibi', desc: 'PDF ekstrelerinizi yükleyin, işlemler otomatik çıkarılsın.' },
  { icon: BarChart3, title: 'Kategori Analizi', desc: 'Market, yemek, ulaşım — harcama dağılımını görün.' },
  { icon: Bell, title: 'Ödeme Hatırlatma', desc: 'Son ödeme tarihi yaklaşınca Telegram ile uyarı alın.' },
  { icon: Shield, title: 'Güvenli Saklama', desc: 'Tam kart numarası saklanmaz, yalnızca son 4 hane.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--slate-50)' }}>
      {/* Left — dark hero panel */}
      <div
        className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10"
        style={{ background: 'var(--navy-900)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--blue-600)' }}
          >
            <LogoMark size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Ekstre Takip
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h1
              className="text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            >
              Kredi kartı ekstrelerinizi tek yerden takip edin.
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--slate-400)' }}>
              PDF yükle, işlemleri gör, ödeme tarihlerini kaçırma.
            </p>
          </div>

          <CardPreviewMock />

          <div className="space-y-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--navy-700)' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: 'var(--blue-400)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--slate-500)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--navy-600)' }}>© 2025 Ekstre Takip</p>
      </div>

      {/* Right — CTA */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--navy-900)' }}
            >
              <LogoMark size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Ekstre Takip</h1>
          </div>

          <div>
            <h2
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Hoş geldiniz
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--slate-500)' }}>
              Hesabınızla devam edin
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center text-sm font-semibold')}>
              Giriş Yap
            </Link>
            <Link href="/register" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-center text-sm font-semibold')}>
              Hesap Oluştur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
