'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn, formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { Plus, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function BudgetPage() {
  const { currentMonth, currentYear } = useAppStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [newBudget, setNewBudget] = useState({ categoryId: '', amount: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['budgets', currentMonth, currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      return res.json()
    },
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await fetch('/api/categories'); return res.json() },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/budgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newBudget.categoryId, amount: Number(newBudget.amount), month: currentMonth, year: currentYear }),
      })
    },
    onSuccess: () => {
      toast.success('Orçamento criado!')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setShowForm(false)
      setNewBudget({ categoryId: '', amount: '' })
    },
  })

  const totalBudget = data?.budgets?.reduce((s: number, b: any) => s + Number(b.amount), 0) || 0
  const totalSpent = data?.budgets?.reduce((s: number, b: any) => s + b.spent, 0) || 0
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Orçamento</h1>
          <p className="text-[13px] text-muted mt-0.5">{formatCurrency(totalSpent)} de {formatCurrency(totalBudget)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus className="h-4 w-4" /> Novo Orçamento</button>
      </div>

      {/* Total */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-muted" /><span className="text-[13px] font-semibold">Consumo Total</span></div>
          <span className={cn('text-[22px] font-extrabold', totalPct > 100 ? 'text-destructive' : totalPct > 80 ? 'text-warning' : 'text-accent')}>{totalPct.toFixed(0)}%</span>
        </div>
        <div className="progress-track h-3">
          <div className={cn('progress-fill', totalPct > 100 ? 'bg-destructive' : totalPct > 80 ? 'bg-warning' : 'bg-accent')} style={{ width: `${Math.min(totalPct, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-muted"><span>Gasto: {formatCurrency(totalSpent)}</span><span>Limite: {formatCurrency(totalBudget)}</span></div>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 animate-fade-up border-primary/20">
          <p className="text-[13px] font-bold mb-4">Criar Orçamento</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={newBudget.categoryId} onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })} className="input flex-1">
              <option value="">Selecione...</option>
              {categoriesData?.categories?.filter((c: any) => c.type === 'EXPENSE').map((c: any) => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
            </select>
            <input type="number" value={newBudget.amount} onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })} placeholder="Limite (R$)" className="input sm:w-40" />
            <button onClick={() => createMutation.mutate()} disabled={!newBudget.categoryId || !newBudget.amount} className="btn btn-primary disabled:opacity-40">Salvar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {isLoading ? [...Array(4)].map((_, i) => <div key={i} className="h-[180px] skeleton rounded-2xl" />) : data?.budgets?.length > 0 ? data.budgets.map((b: any) => {
          const pct = b.percentage; const over = pct > 100; const near = pct > 80 && !over; const rem = Number(b.amount) - b.spent
          return (
            <div key={b.id} className={cn('card p-5', over && 'border-destructive/20 glow-expense', near && 'border-warning/20')}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card-elevated text-xl border border-border">{b.category?.icon}</div>
                  <div><p className="text-[14px] font-bold">{b.category?.name}</p><p className="text-[11px] text-muted">Mensal</p></div>
                </div>
                {over ? <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
                  : near ? <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-warning" /></div>
                  : <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-accent" /></div>}
              </div>
              <div className="flex justify-between items-baseline mb-3">
                <span className={cn('text-[20px] font-extrabold', over ? 'text-destructive' : '')}>{formatCurrency(b.spent)}</span>
                <span className="text-[12px] text-muted">{formatCurrency(Number(b.amount))}</span>
              </div>
              <div className="progress-track"><div className={cn('progress-fill', over ? 'bg-destructive' : near ? 'bg-warning' : 'bg-accent')} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div className="flex justify-between mt-3">
                <span className="text-[11px] text-muted">{over ? `⚠️ Acima em ${formatCurrency(Math.abs(rem))}` : `Restam ${formatCurrency(rem)}`}</span>
                <span className={cn('text-[11px] font-bold', over ? 'text-destructive' : near ? 'text-warning' : 'text-accent')}>{pct.toFixed(0)}%</span>
              </div>
            </div>
          )
        }) : <div className="col-span-full empty-state"><p className="text-[13px]">Nenhum orçamento definido</p></div>}
      </div>
    </div>
  )
}
