'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ExpensePieChartProps {
  data: Array<{ name: string; total?: number; value?: number; icon?: string; color?: string }>
}

export function ExpensePieChart({ data: rawData }: ExpensePieChartProps) {
  // Normalize: API returns `total`, but we use `value` for recharts
  const data = rawData.map(d => ({ ...d, value: d.total || d.value || 0 }))
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="empty-state h-48"><p className="text-[13px]">Sem dados de categorias</p></div>
  }

  const COLORS = ['#8B5CF6', '#06D6A0', '#3B82F6', '#F59E0B', '#F43F5E', '#EC4899', '#14B8A6', '#A78BFA']
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-[200px] h-[200px] shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={data[i].color || COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload
                return (
                  <div className="card-elevated px-3 py-2 text-[11px] shadow-xl">
                    <p className="font-bold">{d.name}</p>
                    <p className="text-muted">{formatCurrency(d.value)}</p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2.5 w-full">
        {data.slice(0, 6).map((item, i) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
          return (
            <div key={item.name} className="flex items-center gap-3 group">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color || COLORS[i % COLORS.length] }} />
              <span className="text-[12px] font-medium flex-1 truncate">{item.icon} {item.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 rounded-full bg-card-elevated overflow-hidden hidden sm:block">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color || COLORS[i % COLORS.length] }} />
                </div>
                <span className="text-[11px] text-muted w-8 text-right">{pct}%</span>
                <span className="text-[12px] font-bold w-24 text-right">{formatCurrency(item.value)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
