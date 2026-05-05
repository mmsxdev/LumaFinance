'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatCurrency } from '@/lib/utils'
import { INSTITUTIONS } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { Plus, Building2, User, Trash2, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({ institutionId: 'manual', name: '', type: 'CHECKING', balanceAmount: '' })
  const [userProfile, setUserProfile] = useState<{ email: string; id: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserProfile({ email: data.user.email || '', id: data.user.id })
    })
  }, [])

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => { const res = await fetch('/api/accounts'); return res.json() },
  })

  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const inst = INSTITUTIONS.find(i => i.id === newAccount.institutionId)
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccount,
          institutionName: inst?.name || newAccount.name,
          institutionColor: inst?.color || '#6B7280',
          balanceAmount: Number(newAccount.balanceAmount) || 0,
        }),
      })
      return res.json()
    },
    onSuccess: () => {
      toast.success('Conta adicionada!')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowAddAccount(false)
      setNewAccount({ institutionId: 'manual', name: '', type: 'CHECKING', balanceAmount: '' })
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      // Assuming DELETE /api/accounts/[id] exists
      // Wait, we don't have delete account API yet. We'll add it or mock the error if not needed.
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      toast.success('Conta removida!')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight">Configurações</h1>
        <p className="text-[13px] text-muted mt-0.5">Gerencie suas contas bancárias e perfil</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bank Accounts */}
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[15px] font-bold flex items-center gap-2">
                  <Building2 className="h-[18px] w-[18px] text-primary" /> Contas Bancárias
                </h2>
                <p className="text-[12px] text-muted mt-1">Instituições financeiras conectadas</p>
              </div>
              <button onClick={() => setShowAddAccount(!showAddAccount)} className="btn btn-primary text-[12px] py-2">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>

            {showAddAccount && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-fade-in">
                <p className="text-[13px] font-bold mb-4">Nova Instituição</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select value={newAccount.institutionId} onChange={(e) => setNewAccount({ ...newAccount, institutionId: e.target.value })} className="input">
                    {INSTITUTIONS.map((inst) => <option key={inst.id} value={inst.id}>{inst.icon} {inst.name}</option>)}
                  </select>
                  <input value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="Nome personalizado (opcional)" className="input" />
                  <select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className="input">
                    <option value="CHECKING">Conta Corrente</option>
                    <option value="SAVINGS">Poupança</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="INVESTMENT">Investimento</option>
                  </select>
                  <input type="number" value={newAccount.balanceAmount} onChange={(e) => setNewAccount({ ...newAccount, balanceAmount: e.target.value })} placeholder="Saldo inicial (R$)" className="input" />
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <button onClick={() => setShowAddAccount(false)} className="btn btn-ghost py-2">Cancelar</button>
                  <button onClick={() => createAccountMutation.mutate()} disabled={!newAccount.balanceAmount} className="btn btn-primary py-2 disabled:opacity-50">Salvar Conta</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {accountsData?.accounts?.length > 0 ? accountsData.accounts.map((acc: any) => (
                <div key={acc.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card-elevated p-4 group hover:border-border-strong transition-all">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-lg shadow-black/20" style={{ background: `linear-gradient(135deg, ${acc.institutionColor}, ${acc.institutionColor}99)` }}>
                    {acc.institutionName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate">{acc.name || acc.institutionName}</p>
                    <p className="text-[12px] text-muted capitalize">{acc.type.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold">{formatCurrency(Number(acc.balanceAmount))}</p>
                  </div>
                </div>
              )) : (
                <div className="empty-state py-8">
                  <p className="text-[13px]">Nenhuma conta cadastrada</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Profile */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-[15px] font-bold flex items-center gap-2 mb-6">
              <User className="h-[18px] w-[18px] text-primary" /> Meu Perfil
            </h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-xl shadow-primary/10">
                <span className="text-2xl font-bold text-white">{userProfile?.email?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <p className="text-[15px] font-bold">{userProfile?.email?.split('@')[0] || 'Usuário'}</p>
              <div className="flex items-center gap-1.5 mt-1 text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Conta Ativa</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1 block">Email</label>
                <div className="flex items-center gap-3 bg-card-elevated rounded-xl p-3 border border-border">
                  <Mail className="h-4 w-4 text-muted shrink-0" />
                  <span className="text-[13px] truncate">{userProfile?.email || 'Carregando...'}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1 block">Plano</label>
                <div className="flex items-center gap-3 bg-card-elevated rounded-xl p-3 border border-border">
                  <span className="text-[13px] font-bold gradient-text">Pro (100% Gratuito)</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
