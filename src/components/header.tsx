'use client'

import { useAppStore } from '@/stores/app-store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MONTH_NAMES } from '@/lib/constants'
import { LogOut, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header() {
  const { currentMonth, currentYear, setMonth } = useAppStore()
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email || '')
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const prevMonth = () => {
    if (currentMonth === 1) setMonth(12, currentYear - 1)
    else setMonth(currentMonth - 1, currentYear)
  }

  const nextMonth = () => {
    if (currentMonth === 12) setMonth(1, currentYear + 1)
    else setMonth(currentMonth + 1, currentYear)
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-[64px] items-center justify-between border-b border-border px-6 bg-background/70 backdrop-blur-xl"
    >
      {/* Month Navigator */}
      <div className="flex items-center gap-1.5 rounded-xl bg-card border border-border px-1.5 py-1">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sidebar-hover hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 px-3 min-w-[170px] justify-center">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-[13px] font-semibold tracking-tight">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
        </div>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sidebar-hover hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        {email && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{email.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-[12px] text-muted hidden sm:block">{email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
