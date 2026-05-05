'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  type?: 'balance' | 'income' | 'expense' | 'savings'
  className?: string
}

const configs: Record<string, { icon: LucideIcon; gradient: string; textColor: string; iconBg: string; glowClass: string }> = {
  balance: {
    icon: DollarSign,
    gradient: 'from-primary/10 to-primary/[0.02]',
    textColor: 'text-foreground',
    iconBg: 'bg-primary/10 text-primary',
    glowClass: 'glow-primary',
  },
  income: {
    icon: TrendingUp,
    gradient: 'from-income/10 to-income/[0.02]',
    textColor: 'text-income',
    iconBg: 'bg-income/10 text-income',
    glowClass: 'glow-income',
  },
  expense: {
    icon: TrendingDown,
    gradient: 'from-expense/10 to-expense/[0.02]',
    textColor: 'text-expense',
    iconBg: 'bg-expense/10 text-expense',
    glowClass: 'glow-expense',
  },
  savings: {
    icon: PiggyBank,
    gradient: 'from-accent/10 to-accent/[0.02]',
    textColor: 'text-accent',
    iconBg: 'bg-accent/10 text-accent',
    glowClass: 'glow-accent',
  },
}

export function StatCard({ title, value, subtitle, type = 'balance', className }: StatCardProps) {
  const config = configs[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300',
        'hover:border-border-strong hover:shadow-lg',
        config.glowClass,
        className
      )}
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', config.gradient)} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</span>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105', config.iconBg)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p className={cn('text-[26px] font-extrabold tracking-tight leading-none', config.textColor)}>
          {type === 'savings' ? `${value.toFixed(1)}%` : formatCurrency(value)}
        </p>

        {subtitle && (
          <p className="mt-2 text-[11px] text-muted leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
