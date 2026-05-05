import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAIResponse } from '@/lib/gemini'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getUserId() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  return dbUser?.id || null
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await request.json()

  // Build financial context
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [accounts, monthlyTxs, budgets, goals] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { userId, isActive: true },
      select: { institutionName: true, type: true, balanceAmount: true },
    }),
    prisma.transaction.findMany({
      where: { account: { userId }, date: { gte: startOfMonth }, status: 'COMPLETED' },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { category: true },
    }),
    prisma.goal.findMany({
      where: { userId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
    }),
  ])

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balanceAmount), 0)
  const monthlyIncome = monthlyTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0)
  const monthlyExpenses = monthlyTxs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : '0'

  const topExpenses = monthlyTxs
    .filter(t => Number(t.amount) < 0)
    .sort((a, b) => Number(a.amount) - Number(b.amount))
    .slice(0, 5)
    .map(t => `${t.cleanDescription || t.description}: R$ ${Math.abs(Number(t.amount)).toFixed(2)}`)
    .join(', ')

  const accountsSummary = accounts.map(a => `${a.institutionName} (${a.type}): R$ ${Number(a.balanceAmount).toFixed(2)}`).join(' | ')
  const goalsStr = goals.map(g => `${g.name}: R$ ${Number(g.currentAmount).toFixed(0)}/R$ ${Number(g.targetAmount).toFixed(0)}`).join(' | ')

  const systemInstruction = `Você é um consultor financeiro pessoal especializado em finanças brasileiras. Dados do usuário:

CONTAS: ${accountsSummary}
SALDO TOTAL: R$ ${totalBalance.toFixed(2)}
RECEITAS DO MÊS: R$ ${monthlyIncome.toFixed(2)}
DESPESAS DO MÊS: R$ ${monthlyExpenses.toFixed(2)}
TAXA DE POUPANÇA: ${savingsRate}%
MAIORES GASTOS: ${topExpenses || 'Nenhum'}
METAS: ${goalsStr || 'Sem metas ativas'}

REGRAS:
- Dê conselhos práticos baseados nos dados reais acima
- Use português brasileiro claro e acessível
- Mencione valores e percentuais específicos
- Conheça o contexto BR: Tesouro Direto, CDB, PIX, Nubank etc.
- Seja empático mas direto
- Use emojis com moderação
- NUNCA invente dados que não estão no contexto`

  const fullPrompt = history?.length
    ? history.map((h: any) => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.content}`).join('\n') + `\nUsuário: ${message}`
    : message

  try {
    const response = await generateAIResponse(fullPrompt, systemInstruction)
    return Response.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return Response.json({ error: 'Erro no consultor IA' }, { status: 500 })
  }
}
