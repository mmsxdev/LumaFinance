'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CashflowAreaChartProps {
  data: Array<{ day: number; income: number; expense: number }>
}

export function CashflowAreaChart({ data }: CashflowAreaChartProps) {
  if (!data || data.length === 0) {
    return <div className="empty-state h-48"><p className="text-[13px]">Sem dados de fluxo</p></div>
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06D6A0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#06D6A0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6B80' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6B80' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null
              return (
                <div className="card-elevated px-3 py-2 text-[11px] shadow-xl border border-border">
                  <p className="font-bold text-muted mb-1">Dia {label}</p>
                  {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-muted">{p.dataKey === 'income' ? 'Receita' : 'Despesa'}:</span>
                      <span className="font-bold">{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              )
            }}
          />
          <Area type="monotone" dataKey="income" stroke="#06D6A0" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4, stroke: '#06D6A0', strokeWidth: 2, fill: '#06060B' }} />
          <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, stroke: '#F43F5E', strokeWidth: 2, fill: '#06060B' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
