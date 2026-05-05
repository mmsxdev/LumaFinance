'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useState, useRef } from 'react'
import { Search, Plus, Sparkles, Loader2, Trash2, ArrowUpRight, ArrowDownRight, Upload, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

export default function TransactionsPage() {
  const { currentMonth, currentYear } = useAppStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', currentMonth, currentYear, search, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: String(currentMonth),
        year: String(currentYear),
        ...(search && { search }),
        ...(selectedCategory && { categoryId: selectedCategory }),
      })
      const res = await fetch(`/api/transactions?${params}`)
      return res.json()
    },
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await fetch('/api/categories'); return res.json() },
  })

  const categorizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/categorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`${data.count} transações categorizadas pela IA!`)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Erro na categorização automática'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/transactions/${id}`, { method: 'DELETE' }) },
    onSuccess: () => {
      toast.success('Transação removida')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, categoryId }: { id: string; categoryId: string }) => {
      await fetch(`/api/transactions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId }) })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Transações</h1>
          <p className="text-[13px] text-muted mt-0.5">{data?.total || 0} transações no período</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => categorizeMutation.mutate()} disabled={categorizeMutation.isPending} className="btn btn-accent">
            {categorizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="hidden sm:inline">Categorizar IA</span>
          </button>
          <button onClick={() => { setShowImport(!showImport); setShowForm(false) }} className="btn btn-ghost">
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Importar OFX</span>
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false) }} className="btn btn-primary">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar transações..." className="input input-icon" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input w-auto min-w-[180px]">
          <option value="">Todas categorias</option>
          {categoriesData?.categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>

      {/* Forms */}
      {showForm && <AddTransactionForm categories={categoriesData?.categories || []} onClose={() => setShowForm(false)} />}
      {showImport && <ImportTransactionsForm onClose={() => setShowImport(false)} />}

      {/* Transaction List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-[60px] skeleton" />)}
          </div>
        ) : data?.transactions?.length > 0 ? (
          <div className="divide-y divide-border">
            {data.transactions.map((tx: any) => {
              const isPositive = Number(tx.amount) >= 0
              return (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-card-hover transition-colors group">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card-elevated text-lg border border-border">
                    {tx.category?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{tx.cleanDescription || tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-muted">{tx.category?.name || 'Sem categoria'}</span>
                      <span className="text-[11px] text-muted">•</span>
                      <span className="text-[11px] text-muted">{formatDate(tx.date)}</span>
                      <span className="text-[11px] text-muted">•</span>
                      <span className="text-[11px] text-muted">{tx.account?.institutionName}</span>
                      {tx.aiCategorized && <span className="badge badge-ai ml-1">✨ IA</span>}
                    </div>
                  </div>
                  <select
                    value={tx.categoryId || ''}
                    onChange={(e) => updateCategoryMutation.mutate({ id: tx.id, categoryId: e.target.value })}
                    className="input w-auto text-[11px] py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity max-w-[130px]"
                  >
                    <option value="">Sem categoria</option>
                    {categoriesData?.categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  <div className={cn('flex items-center gap-1.5 shrink-0 min-w-[110px] justify-end', isPositive ? 'text-income' : 'text-expense')}>
                    {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    <span className="text-[13px] font-bold">{formatCurrency(Math.abs(Number(tx.amount)))}</span>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(tx.id)}
                    className="p-2 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state m-4">
            <p className="text-[13px]">Nenhuma transação encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ImportTransactionsForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [accountId, setAccountId] = useState('')

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => { const res = await fetch('/api/accounts'); return res.json() },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const reader = new FileReader()

    reader.onload = async (event) => {
      const text = event.target?.result as string
      let transactions: any[] = []

      // Palavras-chave para filtrar movimentações internas (CDB, investimentos internos)
      const INTERNAL_KEYWORDS = [
        'aplicacao', 'aplicação', 'resgate', 'cdb', 'lci', 'lca',
        'porquinho', 'porq obj', 'rendimento', 'iof'
      ]
      const isInternal = (desc: string) =>
        INTERNAL_KEYWORDS.some(kw => desc.toLowerCase().includes(kw))

      try {
        if (ext === 'ofx') {
          const matches = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g)
          if (matches) {
            transactions = matches.map(m => {
              const amtMatch = m.match(/<TRNAMT>([^\r\n<]+)/)
              const dateMatch = m.match(/<DTPOSTED>([^\r\n<]+)/)
              const memoMatch = m.match(/<MEMO>([^\r\n<]+)/)
              const nameMatch = m.match(/<NAME>([^\r\n<]+)/)
              if (amtMatch && dateMatch) {
                const d = dateMatch[1].trim()
                const dateStr = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`
                // Prefer NAME if available; fallback to MEMO
                const rawDesc = (nameMatch?.[1] || memoMatch?.[1] || 'Transação').trim()
                // Filter out internal CDB/investment moves
                if (isInternal(rawDesc)) return null
                return { amount: parseFloat(amtMatch[1]), date: dateStr, description: rawDesc, accountId }
              }
              return null
            }).filter(Boolean)
          }
        } else if (ext === 'csv') {
          // Detect separator: Banco Inter uses ";"
          const isSemicolon = text.includes(';')
          const delimiter = isSemicolon ? ';' : ','

          // Banco Inter CSVs have 5 header lines before the real data header
          // e.g. " Extrato Conta Corrente ", "Conta ;190078960", "Período ;...", "Saldo ;...", ""
          let csvText = text
          if (isSemicolon) {
            const lines = text.split('\n')
            // Find the line that starts with "Data" (the real header)
            const headerIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('data'))
            if (headerIdx > 0) csvText = lines.slice(headerIdx).join('\n')
          }

          const result = Papa.parse(csvText, { header: true, skipEmptyLines: true, delimiter })
          const headers = result.meta.fields || []

          transactions = result.data.map((row: any) => {
            // Flexible column name matching (BR banks vary a lot)
            const dateKey = headers.find((h: string) => /data/i.test(h)) || ''
            const descKey = headers.find((h: string) => /hist[oó]rico/i.test(h)) || ''
            const descDetailKey = headers.find((h: string) => /descri[cç]/i.test(h)) || ''
            const amtKey = headers.find((h: string) => /valor/i.test(h) && !/saldo/i.test(h)) || ''

            const date = row[dateKey]?.trim()
            const hist = row[descKey]?.trim() || ''
            const descDetail = row[descDetailKey]?.trim() || ''
            const desc = descDetail ? `${hist} - ${descDetail}` : hist
            const amtRaw = row[amtKey]
            const amount = typeof amtRaw === 'string'
              ? parseFloat(amtRaw.replace(/\./g, '').replace(',', '.'))
              : Number(amtRaw)

            if (!date || !desc || isNaN(amount)) return null
            // Filter internal transactions
            if (isInternal(desc)) return null

            // Convert DD/MM/YYYY → YYYY-MM-DD
            let formattedDate = date
            if (date.includes('/')) {
              const parts = date.split('/')
              if (parts[0].length <= 2) formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
            }
            return { amount, date: formattedDate, description: desc, accountId }
          }).filter(Boolean)
        }

        if (transactions.length === 0) throw new Error('Nenhuma transação encontrada ou formato não suportado.')

        const res = await fetch('/api/transactions/batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        toast.success(`${data.count} transações importadas com sucesso!`)
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        onClose()

      } catch (err: any) {
        toast.error('Erro na importação: ' + err.message)
      } finally {
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="card p-6 mb-6 animate-fade-up border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[15px] font-bold">Importar Extrato Bancário</p>
          <p className="text-[12px] text-muted">Faça upload do arquivo OFX ou CSV do seu banco.</p>
        </div>
        <button onClick={onClose} className="btn btn-ghost py-1 px-3 text-[12px]">Cancelar</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input sm:w-64">
          <option value="">Selecione a conta de destino...</option>
          {accountsData?.accounts?.map((a: any) => <option key={a.id} value={a.id}>{a.institutionName} - {a.name}</option>)}
        </select>

        <div className="relative flex-1 w-full">
          <input
            type="file" accept=".ofx,.csv" ref={fileInputRef} onChange={handleFileUpload} disabled={loading || !accountId}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className={cn("flex items-center justify-center gap-3 border-2 border-dashed rounded-xl py-8 transition-colors", accountId ? "border-primary/50 hover:border-primary hover:bg-primary/5" : "border-border opacity-50")}>
            {loading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <FileUp className="h-6 w-6 text-primary" />}
            <span className="text-[13px] font-medium">{loading ? 'Processando...' : accountId ? 'Arraste ou clique para enviar OFX/CSV' : 'Selecione uma conta primeiro'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddTransactionForm({ categories, onClose }: { categories: any[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    description: '', amount: '', date: new Date().toISOString().split('T')[0],
    type: 'DEBIT', categoryId: '', accountId: '',
  })

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => { const res = await fetch('/api/accounts'); return res.json() },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const amount = form.type === 'DEBIT' ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount))
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount, accountId: form.accountId || accountsData?.accounts?.[0]?.id }),
      })
      return res.json()
    },
    onSuccess: () => {
      toast.success('Transação adicionada!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: () => toast.error('Erro ao adicionar transação'),
  })

  return (
    <div className="card p-5 mb-6 animate-fade-up border-primary/20">
      <p className="text-[13px] font-bold mb-4">Nova Transação</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" className="input" />
        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Valor (R$)" step="0.01" className="input" />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
          <option value="DEBIT">Despesa</option>
          <option value="CREDIT">Receita</option>
          <option value="PIX">PIX</option>
          <option value="TRANSFER">Transferência</option>
        </select>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
          <option value="">Categoria (IA decide)</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="input">
          <option value="">Conta padrão</option>
          {accountsData?.accounts?.map((a: any) => <option key={a.id} value={a.id}>{a.institutionName}</option>)}
        </select>
      </div>
      <div className="mt-4 flex gap-2 justify-end">
        <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
        <button onClick={() => mutation.mutate()} disabled={!form.description || !form.amount} className="btn btn-primary disabled:opacity-40">Salvar</button>
      </div>
    </div>
  )
}
