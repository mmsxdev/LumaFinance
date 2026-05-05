'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, FileText, FileSpreadsheet, Loader2, BarChart3 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default function ReportsPage() {
  const { currentMonth, currentYear } = useAppStore()

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard', currentMonth, currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?month=${currentMonth}&year=${currentYear}`)
      return res.json()
    },
  })

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', currentMonth, currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}&limit=1000`)
      return res.json()
    },
  })

  const isLoading = loadingDash || loadingTx

  const generatePDF = () => {
    if (!dashboard || !txData) return

    const doc = new jsPDF()
    const monthStr = `${currentMonth.toString().padStart(2, '0')}/${currentYear}`

    // Header
    doc.setFontSize(20)
    doc.setTextColor(33, 33, 33)
    doc.text('Relatório Financeiro', 14, 22)
    
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Período: ${monthStr}`, 14, 30)

    // Summary Cards
    doc.setFontSize(14)
    doc.setTextColor(33, 33, 33)
    doc.text('Resumo do Mês', 14, 45)

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Receitas: ${formatCurrency(dashboard.totalIncome)}`, 14, 55)
    doc.text(`Despesas: ${formatCurrency(dashboard.totalExpenses)}`, 14, 62)
    doc.text(`Saldo Atual das Contas: ${formatCurrency(dashboard.totalBalance)}`, 14, 69)
    doc.text(`Taxa de Poupança: ${dashboard.savingsRate.toFixed(1)}%`, 14, 76)

    // Category Breakdown Table
    if (dashboard.categoryBreakdown?.length > 0) {
      doc.text('Despesas por Categoria', 14, 95)
      const catData = dashboard.categoryBreakdown.map((c: any) => [c.name, formatCurrency(c.total), `${c.count} transações`])
      ;(doc as any).autoTable({
        startY: 100,
        head: [['Categoria', 'Total Gasto', 'Quantidade']],
        body: catData,
        theme: 'striped',
        headStyles: { fillColor: [63, 63, 70] }
      })
    }

    // Transactions Table
    if (txData.transactions?.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 95
      doc.text('Transações do Período', 14, finalY + 15)
      
      const txRows = txData.transactions.map((t: any) => [
        formatDate(t.date),
        t.cleanDescription || t.description,
        t.category?.name || 'Sem categoria',
        formatCurrency(Number(t.amount))
      ])

      ;(doc as any).autoTable({
        startY: finalY + 20,
        head: [['Data', 'Descrição', 'Categoria', 'Valor']],
        body: txRows,
        theme: 'striped',
        headStyles: { fillColor: [63, 63, 70] },
        didParseCell: function(data: any) {
          if (data.section === 'body' && data.column.index === 3) {
            const val = data.cell.raw
            if (val.includes('-')) data.cell.styles.textColor = [220, 38, 38] // Red for expenses
            else data.cell.styles.textColor = [22, 163, 74] // Green for income
          }
        }
      })
    }

    doc.save(`LumaFinance_Relatorio_${monthStr.replace('/', '_')}.pdf`)
  }

  const generateCSV = () => {
    if (!txData?.transactions) return

    const headers = ['Data', 'Descricao', 'Categoria', 'Conta', 'Valor', 'Tipo']
    const rows = txData.transactions.map((t: any) => [
      formatDate(t.date),
      `"${t.cleanDescription || t.description}"`,
      `"${t.category?.name || ''}"`,
      `"${t.account?.institutionName || ''}"`,
      Number(t.amount).toFixed(2),
      Number(t.amount) >= 0 ? 'Receita' : 'Despesa'
    ])

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `LumaFinance_Export_${currentMonth}_${currentYear}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight">Relatórios</h1>
        <p className="text-[13px] text-muted mt-0.5">Exporte seus dados financeiros para análise externa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* PDF Export Card */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-[16px] font-bold mb-2">Relatório Consolidado (PDF)</h2>
            <p className="text-[13px] text-muted mb-6">Gera um documento formatado com o resumo do mês, gastos por categoria e lista de transações para impressão ou contabilidade.</p>
          </div>
          <button onClick={generatePDF} disabled={isLoading} className="btn btn-primary w-full justify-center">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar PDF
          </button>
        </div>

        {/* CSV Export Card */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-[16px] font-bold mb-2">Exportar Dados (CSV)</h2>
            <p className="text-[13px] text-muted mb-6">Baixa todas as transações do mês em formato bruto para Excel, Google Sheets ou outras ferramentas de análise de dados.</p>
          </div>
          <button onClick={generateCSV} disabled={isLoading} className="btn btn-accent w-full justify-center">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar Planilha CSV
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="card p-6">
        <h3 className="text-[15px] font-bold flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted" /> Preview dos Dados a Exportar
        </h3>
        
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-muted animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card-elevated p-4 rounded-xl border border-border">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">Total Transações</p>
              <p className="text-[18px] font-bold">{txData?.transactions?.length || 0}</p>
            </div>
            <div className="bg-card-elevated p-4 rounded-xl border border-border">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">Receitas</p>
              <p className="text-[18px] font-bold text-income">{formatCurrency(dashboard?.totalIncome || 0)}</p>
            </div>
            <div className="bg-card-elevated p-4 rounded-xl border border-border">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">Despesas</p>
              <p className="text-[18px] font-bold text-expense">{formatCurrency(dashboard?.totalExpenses || 0)}</p>
            </div>
            <div className="bg-card-elevated p-4 rounded-xl border border-border">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">Categorias</p>
              <p className="text-[18px] font-bold">{dashboard?.categoryBreakdown?.length || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
