'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CreditCard,
  Upload,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cards', label: 'Kartlarım', icon: CreditCard },
  { href: '/statements', label: 'Ekstreler', icon: FileText },
  { href: '/statements/upload', label: 'Ekstre Yükle', icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--navy-900)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--navy-700)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--blue-600)' }}
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Ekstre Takip
            </p>
            <p className="text-xs" style={{ color: 'var(--slate-400)' }}>Kart yönetimi</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn('nav-link', isActive && 'active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-0.5 border-t pt-4" style={{ borderColor: 'var(--navy-700)' }}>
        <Link href="/settings" className={cn('nav-link', pathname === '/settings' && 'active')}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          Ayarlar
        </Link>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left"
          style={{ color: 'var(--slate-400)' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
