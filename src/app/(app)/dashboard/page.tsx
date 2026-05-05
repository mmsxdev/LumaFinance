'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { StatCard } from '@/components/stat-card'
import { ExpensePieChart } from '@/components/charts/expense-pie'
import { CashflowAreaChart } from '@/components/charts/cashflow-area'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function DashboardPage() {
  const { currentMonth, currentYear } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', currentMonth, currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?month=${currentMonth}&year=${currentYear}`)
      return res.json()
    },
  })

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-muted mt-0.5">Visão geral das suas finanças</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        <StatCard
          title="Saldo Total"
          value={data?.totalBalance || 0}
          subtitle={`${data?.accounts?.length || 0} contas ativas`}
          type="balance"
        />
        <StatCard
          title="Receitas do Mês"
          value={data?.totalIncome || 0}
          type="income"
        />
        <StatCard
          title="Despesas do Mês"
          value={data?.totalExpenses || 0}
          type="expense"
        />
        <StatCard
          title="Taxa de Poupança"
          value={data?.savingsRate || 0}
          subtitle={data?.savingsRate > 20 ? '🎉 Excelente!' : data?.savingsRate > 0 ? '💪 Continue assim' : '⚠️ Atenção'}
          type="savings"
        />
      </div>

      {/* ── Charts ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Category Breakdown */}
        <div className="card p-6">
          <p className="section-header">Gastos por Categoria</p>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-8 skeleton" />)}
            </div>
          ) : (
            <ExpensePieChart data={data?.categoryBreakdown || []} />
          )}
        </div>

        {/* Daily Cashflow */}
        <div className="card p-6">
          <p className="section-header">Fluxo de Caixa Diário</p>
          {isLoading ? (
            <div className="h-[260px] skeleton" />
          ) : (
            <CashflowAreaChart data={data?.dailyCashFlow || []} />
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Transactions */}
        <div className="card p-6 xl:col-span-2">
          <p className="section-header">Transações Recentes</p>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
            </div>
          ) : data?.recentTransactions?.length > 0 ? (
            <div className="space-y-1">
              {data.recentTransactions.map((tx: any) => {
                const isPositive = Number(tx.amount) >= 0
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-card-hover transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-elevated text-lg">
                        {tx.category?.icon || '📦'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{tx.cleanDescription || tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted">{tx.category?.name || 'Sem categoria'}</span>
                          <span className="text-[11px] text-muted">•</span>
                          <span className="text-[11px] text-muted">{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <div className={cn('flex items-center gap-1', isPositive ? 'text-income' : 'text-expense')}>
                        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        <span className="text-[13px] font-bold">{formatCurrency(Math.abs(Number(tx.amount)))}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state h-48">
              <p className="text-[13px]">Nenhuma transação ainda</p>
            </div>
          )}
        </div>

        {/* Accounts */}
        <div className="card p-6">
          <p className="section-header">Suas Contas</p>
          {data?.accounts?.length > 0 ? (
            <div className="space-y-3">
              {data.accounts.map((acc: any) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-card-hover transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                    style={{ background: `linear-gradient(135deg, ${acc.institutionColor}, ${acc.institutionColor}99)` }}
                  >
                    {acc.institutionName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate">{acc.name || acc.institutionName}</p>
                    <p className="text-[11px] text-muted capitalize">{acc.type.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <p className="text-[13px] font-bold shrink-0">{formatCurrency(Number(acc.balanceAmount))}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state h-32">
              <p className="text-[13px]">Adicione uma conta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
