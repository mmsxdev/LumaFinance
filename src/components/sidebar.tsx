'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  FileText,
  Settings,
  Bot,
  ChevronLeft,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/budget', label: 'Orçamento', icon: Wallet },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/reports', label: 'Relatórios', icon: FileText },
  { href: '/ai-advisor', label: 'Consultor IA', icon: Bot },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300 ease-in-out',
        'border-r border-border',
        sidebarOpen ? 'w-[260px]' : 'w-[68px]'
      )}
    >
      {/* ── Logo ── */}
      <div className="flex h-[64px] items-center gap-3 px-5 border-b border-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
          <TrendingUp className="h-[18px] w-[18px] text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-[15px] font-bold gradient-text-primary animate-fade-in tracking-tight">
            LumaFinance
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-sidebar-hover hover:text-foreground transition-all duration-200',
            !sidebarOpen && 'ml-0 mx-auto rotate-180'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-active text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground',
                !sidebarOpen && 'justify-center px-0'
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted group-hover:text-foreground'
                )}
              />
              {sidebarOpen && <span>{item.label}</span>}
              {isActive && sidebarOpen && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      {sidebarOpen && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] border border-border p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">IA Ativa</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Categorização automática habilitada
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
