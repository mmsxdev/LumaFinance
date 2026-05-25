'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useState, useRef } from 'react'
import { Search, Plus, Sparkles, Loader2, Trash2, ArrowUpRight, ArrowDownRight, Upload, FileUp, Check, RotateCcw, Filter } from 'lucide-react'
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
      {showImport && <ImportTransactionsForm categories={categoriesData?.categories || []} onClose={() => setShowImport(false)} />}

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

// Helper to dynamically recommend a category based on keywords
const getSuggestedCategory = (description: string, categories: any[]) => {
  const descLower = description.toLowerCase()
  
  // Keyword dictionary mapping category name patterns
  const keywordMap: Record<string, string[]> = {
    'Moradia': ['aluguel', 'condomínio', 'iptu', 'luz', 'energia', 'água', 'gás', 'internet', 'netflix', 'habitação'],
    'Alimentação': ['supermercado', 'mercado', 'padaria', 'açougue', 'hortifruti', 'extra', 'carrefour', 'ifood', 'restaurante', 'lanche', 'pizza', 'burger', 'salgadinhos', 'pizzaria', 'deli'],
    'Transporte': ['uber', '99', 'taxi', 'combustível', 'gasolina', 'estacionamento', 'pedágio', 'metro', 'ônibus', 'sitpass', 'viagem'],
    'Saúde': ['farmácia', 'drogasil', 'consulta', 'médico', 'hospital', 'plano de saúde', 'exame', 'radiologika', 'raio-x', 'cabelo', 'pomada'],
    'Lazer': ['cinema', 'teatro', 'show', 'spotify', 'prime video', 'disney', 'jogo', 'steam', 'bilhete', 'pecuaria'],
    'Educação': ['escola', 'faculdade', 'curso', 'udemy', 'livro', 'mensalidade', 'alura'],
    'Roupas': ['renner', 'riachuelo', 'zara', 'shein', 'roupa', 'calçado', 'tênis'],
    'Pets': ['petshop', 'veterinário', 'ração', 'petz'],
    'Finanças': ['tarifa', 'taxa', 'juros', 'seguro', 'anuidade', 'empréstimo', 'digio', 'neon', 'fatura'],
    'Investimentos': ['tesouro', 'cdb', 'lci', 'lca', 'fundos', 'ações', 'previdência', 'aplicacao', 'aplicação', 'resgate', 'porquinho', 'porq obj', 'rendimento'],
    'Salário': ['salário', 'pagamento', 'holerite', 'remuneração', 'portabilidade'],
    'Freelance': ['freelance', 'projeto', 'consultoria', 'serviço']
  }

  for (const [catName, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => descLower.includes(kw))) {
      const match = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (match) return match
    }
  }

  // Fallback to "Outros"
  return categories.find(c => c.name === 'Outros') || categories[0] || null
}

function ImportTransactionsForm({ categories, onClose }: { categories: any[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [parsedTransactions, setParsedTransactions] = useState<any[] | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'no-investments' | 'investments-only' | 'credits' | 'debits'>('no-investments')

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => { const res = await fetch('/api/accounts'); return res.json() },
  })

  // Palavras-chave para filtrar movimentações internas (CDB, investimentos internos)
  const INTERNAL_KEYWORDS = [
    'aplicacao', 'aplicação', 'resgate', 'cdb', 'lci', 'lca',
    'porquinho', 'porq obj', 'rendimento', 'iof'
  ]
  const isInternal = (desc: string) =>
    INTERNAL_KEYWORDS.some(kw => desc.toLowerCase().includes(kw))

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const reader = new FileReader()

    reader.onload = async (event) => {
      const text = event.target?.result as string
      let transactions: any[] = []

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
                const rawDesc = (nameMatch?.[1] || memoMatch?.[1] || 'Transação').trim()
                return { amount: parseFloat(amtMatch[1]), date: dateStr, description: rawDesc, accountId }
              }
              return null
            }).filter(Boolean)
          }
        } else if (ext === 'csv') {
          const isSemicolon = text.includes(';')
          const delimiter = isSemicolon ? ';' : ','

          let csvText = text
          if (isSemicolon) {
            const lines = text.split('\n')
            const headerIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('data'))
            if (headerIdx > 0) csvText = lines.slice(headerIdx).join('\n')
          }

          const result = Papa.parse(csvText, { header: true, skipEmptyLines: true, delimiter })
          const headers = result.meta.fields || []

          transactions = result.data.map((row: any) => {
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

            let formattedDate = date
            if (date.includes('/')) {
              const parts = date.split('/')
              if (parts[0].length <= 2) formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
            }
            return { amount, date: formattedDate, description: desc, accountId }
          }).filter(Boolean)
        }

        if (transactions.length === 0) throw new Error('Nenhuma transação encontrada ou formato não suportado.')

        setParsedTransactions(transactions)
        
        // Auto-select all by default except internal CDB/investment transactions (safe default)
        const initialSelected = new Set<number>()
        transactions.forEach((tx, idx) => {
          if (!isInternal(tx.description)) {
            initialSelected.add(idx)
          }
        })
        setSelectedIndices(initialSelected)

      } catch (err: any) {
        toast.error('Erro na importação: ' + err.message)
      } finally {
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    if (!parsedTransactions || selectedIndices.size === 0) return
    setLoading(true)

    try {
      const transactionsToImport = parsedTransactions
        .filter((_, idx) => selectedIndices.has(idx))
        .map(tx => {
          const suggested = getSuggestedCategory(tx.description, categories)
          return {
            ...tx,
            accountId,
            categoryId: suggested?.id || null
          }
        })

      const res = await fetch('/api/transactions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: transactionsToImport })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast.success(`${data.count} transações importadas com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    } catch (err: any) {
      toast.error('Erro ao salvar transações: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setParsedTransactions(null)
    setSelectedIndices(new Set())
    setSearchQuery('')
    setFilterType('no-investments')
  }

  // Filtering parsed list
  const filteredList = parsedTransactions ? parsedTransactions.map((tx, idx) => ({ ...tx, idx })).filter(({ description, amount }) => {
    if (searchQuery) {
      const matchText = description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        String(amount).includes(searchQuery)
      if (!matchText) return false
    }

    const internal = isInternal(description)
    if (filterType === 'no-investments' && internal) return false
    if (filterType === 'investments-only' && !internal) return false
    if (filterType === 'credits' && amount < 0) return false
    if (filterType === 'debits' && amount >= 0) return false

    return true
  }) : []

  // Dynamic calculations
  const totalSelectedCount = selectedIndices.size
  let totalSelectedAmount = 0
  let totalSelectedIncome = 0
  let totalSelectedExpense = 0

  if (parsedTransactions) {
    parsedTransactions.forEach((tx, idx) => {
      if (selectedIndices.has(idx)) {
        totalSelectedAmount += tx.amount
        if (tx.amount >= 0) {
          totalSelectedIncome += tx.amount
        } else {
          totalSelectedExpense += Math.abs(tx.amount)
        }
      }
    })
  }

  const handleSelectAllVisible = () => {
    const newSelected = new Set(selectedIndices)
    filteredList.forEach(({ idx }) => newSelected.add(idx))
    setSelectedIndices(newSelected)
  }

  const handleDeselectAllVisible = () => {
    const newSelected = new Set(selectedIndices)
    filteredList.forEach(({ idx }) => newSelected.delete(idx))
    setSelectedIndices(newSelected)
  }

  const toggleSelectIndex = (idx: number) => {
    const newSelected = new Set(selectedIndices)
    if (newSelected.has(idx)) {
      newSelected.delete(idx)
    } else {
      newSelected.add(idx)
    }
    setSelectedIndices(newSelected)
  }

  if (parsedTransactions) {
    return (
      <div className="card p-6 mb-6 animate-fade-up border-primary/20 bg-primary/5 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              Pré-visualização do Extrato
            </h3>
            <p className="text-[12px] text-muted mt-0.5">
              Revise e selecione as transações antes de salvar no sistema.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn btn-ghost py-1.5 px-3 text-[12px] flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Enviar outro arquivo
            </button>
            <button onClick={onClose} className="btn btn-ghost py-1.5 px-3 text-[12px]">
              Cancelar
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-card-elevated/60 p-4 border-border flex flex-col justify-between min-h-[85px] glow-primary">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">A Importar</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[18px] font-bold text-foreground">{totalSelectedCount} <span className="text-[12px] font-normal text-muted-foreground">itens</span></span>
              <span className={cn("text-[14px] font-bold", totalSelectedAmount >= 0 ? "text-income" : "text-expense")}>
                {totalSelectedAmount >= 0 ? '+' : ''}{formatCurrency(totalSelectedAmount)}
              </span>
            </div>
          </div>
          <div className="card bg-card-elevated/60 p-4 border-border flex flex-col justify-between min-h-[85px] glow-income">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Receitas Selecionadas</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[18px] font-bold text-income">{formatCurrency(totalSelectedIncome)}</span>
            </div>
          </div>
          <div className="card bg-card-elevated/60 p-4 border-border flex flex-col justify-between min-h-[85px] glow-expense">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Despesas Selecionadas</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[18px] font-bold text-expense">{formatCurrency(totalSelectedExpense)}</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card/40 p-3 rounded-xl border border-border">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Buscar no extrato..." 
              className="input input-icon text-[13px] py-1.5"
            />
          </div>

          {/* Area/Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filtro:
            </span>
            <select 
              value={filterType} 
              onChange={(e: any) => setFilterType(e.target.value)}
              className="input text-[12px] py-1.5 px-3 w-auto min-w-[170px]"
            >
              <option value="no-investments">Ocultar Investimentos (CDB/Poupança)</option>
              <option value="all">Mostrar Tudo (Todas as Categorias)</option>
              <option value="investments-only">Apenas Investimentos (CDB)</option>
              <option value="credits">Apenas Receitas</option>
              <option value="debits">Apenas Despesas</option>
            </select>
          </div>

          {/* Bulk Select actions */}
          <div className="flex gap-2">
            <button 
              onClick={handleSelectAllVisible} 
              className="btn btn-ghost py-1 px-3 text-[11px] font-medium"
            >
              Selecionar Visíveis
            </button>
            <button 
              onClick={handleDeselectAllVisible} 
              className="btn btn-ghost py-1 px-3 text-[11px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/5"
            >
              Desmarcar Visíveis
            </button>
          </div>
        </div>

        {/* Checklist Table */}
        <div className="card overflow-hidden border border-border/80">
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {filteredList.length > 0 ? (
              filteredList.map((tx) => {
                const isSelected = selectedIndices.has(tx.idx)
                const isPositive = tx.amount >= 0
                const suggested = getSuggestedCategory(tx.description, categories)
                
                return (
                  <div 
                    key={tx.idx} 
                    onClick={() => toggleSelectIndex(tx.idx)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 hover:bg-card-hover transition-colors cursor-pointer select-none",
                      isSelected ? "bg-primary/5" : "opacity-80"
                    )}
                  >
                    {/* Custom Checkbox */}
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectIndex(tx.idx)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-input cursor-pointer"
                      />
                    </div>

                    {/* Category Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card-elevated text-sm border border-border">
                      {suggested?.icon || '📦'}
                    </div>

                    {/* Description & Category suggestion */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-muted-foreground">
                        <span className="text-muted">{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: suggested?.color ? `${suggested.color}15` : 'transparent',
                            color: suggested?.color || 'var(--color-muted)'
                          }}
                        >
                          {suggested?.name || 'Sem Categoria'}
                        </span>
                        {isInternal(tx.description) && (
                          <span className="badge bg-warning/10 text-warning">
                            CDB / Interno
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={cn('text-[12px] font-bold shrink-0 min-w-[90px] text-right', isPositive ? 'text-income' : 'text-expense')}>
                      {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state p-8 text-center text-muted">
                <p className="text-[12px]">Nenhuma transação corresponde aos filtros atuais.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card-elevated/40 p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>Importando para a conta:</span>
            <strong className="text-foreground">
              {accountsData?.accounts?.find((a: any) => a.id === accountId)?.institutionName || 'Conta Selecionada'}
            </strong>
          </div>
          
          <button 
            onClick={handleConfirmImport} 
            disabled={loading || totalSelectedCount === 0} 
            className="btn btn-primary w-full sm:w-auto glow-primary py-2 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Importar {totalSelectedCount} Transações
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Phase 1: Upload (existing code styled cleanly)
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
