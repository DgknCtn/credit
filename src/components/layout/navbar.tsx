'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-base">
            Ekstre Takip
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/cards" className="text-sm text-muted-foreground hover:text-foreground">
            Kartlarım
          </Link>
          <Link href="/statements/upload" className="text-sm text-muted-foreground hover:text-foreground">
            Ekstre Yükle
          </Link>
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm">Hesap</Button>} />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
