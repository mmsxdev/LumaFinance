'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { Plus, Pause, Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function GoalsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', targetAmount: '', icon: '🎯', color: '#8B5CF6' })

  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => { const res = await fetch('/api/goals'); return res.json() },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, targetAmount: Number(form.targetAmount) }) })
    },
    onSuccess: () => { toast.success('Meta criada!'); queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowForm(false); setForm({ name: '', description: '', targetAmount: '', icon: '🎯', color: '#8B5CF6' }) },
  })

  const addValueMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      await fetch(`/api/goals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addAmount: amount }) })
    },
    onSuccess: () => { toast.success('Valor adicionado!'); queryClient.invalidateQueries({ queryKey: ['goals'] }) },
  })

  const icons = ['🎯', '🛡️', '✈️', '💻', '🏠', '🚗', '📚', '💰', '🎉', '🏋️']
  const colors = ['#8B5CF6', '#06D6A0', '#3B82F6', '#F59E0B', '#F43F5E', '#EC4899', '#14B8A6']

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Metas Financeiras</h1>
          <p className="text-[13px] text-muted mt-0.5">{data?.goals?.length || 0} metas ativas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus className="h-4 w-4" /> Nova Meta</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 animate-fade-up border-primary/20">
          <p className="text-[13px] font-bold mb-4">Criar Nova Meta</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da meta" className="input" />
            <input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="Valor alvo (R$)" className="input" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição (opcional)" className="input sm:col-span-2" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-muted mr-1">Ícone:</span>
            {icons.map((ic) => (<button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={cn('h-8 w-8 rounded-lg text-lg flex items-center justify-center border transition-all', form.icon === ic ? 'border-primary bg-primary/10' : 'border-border hover:bg-card-hover')}>{ic}</button>))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-muted mr-1">Cor:</span>
            {colors.map((c) => (<button key={c} onClick={() => setForm({ ...form, color: c })} className={cn('h-6 w-6 rounded-full border-2 transition-all', form.color === c ? 'border-white scale-110' : 'border-transparent')} style={{ background: c }} />))}
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.name || !form.targetAmount} className="btn btn-primary disabled:opacity-40">Criar Meta</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {isLoading ? [...Array(3)].map((_, i) => <div key={i} className="h-[240px] skeleton rounded-2xl" />) : data?.goals?.length > 0 ? data.goals.map((goal: any) => {
          const pct = Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0
          const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
          return (
            <div key={goal.id} className="card overflow-hidden group">
              {/* Top gradient accent */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${goal.color}, ${goal.color}66)` }} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl border border-border" style={{ background: `${goal.color}10` }}>
                      {goal.icon}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold">{goal.name}</p>
                      {goal.description && <p className="text-[11px] text-muted mt-0.5">{goal.description}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[20px] font-extrabold" style={{ color: goal.color }}>{formatCurrency(Number(goal.currentAmount))}</span>
                  <span className="text-[12px] text-muted">{formatCurrency(Number(goal.targetAmount))}</span>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}99)` }} />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-[11px] text-muted">{pct >= 100 ? '🎉 Meta alcançada!' : `Faltam ${formatCurrency(remaining)}`}</span>
                  <span className="text-[12px] font-bold" style={{ color: goal.color }}>{pct.toFixed(1)}%</span>
                </div>

                {/* Quick add */}
                <QuickAddValue goalId={goal.id} color={goal.color} onAdd={(amount) => addValueMutation.mutate({ id: goal.id, amount })} />
              </div>
            </div>
          )
        }) : <div className="col-span-full empty-state"><p className="text-[13px]">Nenhuma meta criada</p></div>}
      </div>
    </div>
  )
}

function QuickAddValue({ goalId, color, onAdd }: { goalId: string; color: string; onAdd: (amount: number) => void }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)

  if (!show) return (
    <button onClick={() => setShow(true)} className="mt-4 w-full py-2 rounded-xl border border-dashed border-border text-[12px] text-muted hover:border-border-strong hover:text-foreground transition-colors">
      + Adicionar valor
    </button>
  )

  return (
    <div className="mt-4 flex gap-2 animate-fade-up">
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="R$ 0,00" className="input flex-1 text-[12px] py-2" autoFocus />
      <button onClick={() => { if (value) { onAdd(Number(value)); setValue(''); setShow(false) } }} className="btn text-[12px] py-2 px-3" style={{ background: `${color}20`, color }}>Salvar</button>
    </div>
  )
}
