import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getUserId() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  return dbUser?.id || null
}

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const [income, expenses, accounts, categoryBreakdown, dailyFlow, recentTransactions] = await Promise.all([
    // Total income
    prisma.transaction.aggregate({
      where: { account: { userId }, date: { gte: startDate, lte: endDate }, amount: { gt: 0 }, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    // Total expenses
    prisma.transaction.aggregate({
      where: { account: { userId }, date: { gte: startDate, lte: endDate }, amount: { lt: 0 }, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    // Accounts with balances
    prisma.bankAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, institutionName: true, institutionColor: true, balanceAmount: true, type: true },
    }),
    // Spending by category
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { account: { userId }, date: { gte: startDate, lte: endDate }, amount: { lt: 0 }, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    }),
    // Daily cash flow
    prisma.transaction.findMany({
      where: { account: { userId }, date: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
      select: { date: true, amount: true },
      orderBy: { date: 'asc' },
    }),
    // Recent transactions
    prisma.transaction.findMany({
      where: { account: { userId }, status: 'COMPLETED' },
      include: { category: true, account: { select: { institutionName: true, institutionColor: true } } },
      orderBy: { date: 'desc' },
      take: 8,
    }),
  ])

  // Get category details
  const categoryIds = categoryBreakdown.map(c => c.categoryId).filter(Boolean)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds as string[] } },
  })

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const categoryData = categoryBreakdown
    .filter(c => c.categoryId && categoryMap[c.categoryId])
    .map(c => ({
      id: categoryMap[c.categoryId!].id,
      name: categoryMap[c.categoryId!].name,
      icon: categoryMap[c.categoryId!].icon,
      color: categoryMap[c.categoryId!].color,
      total: Math.abs(Number(c._sum.amount)),
      count: c._count,
    }))
    .sort((a, b) => b.total - a.total)

  // Process daily flow
  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyData: { day: number; income: number; expense: number }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTxs = dailyFlow.filter(t => new Date(t.date).getDate() === d)
    dailyData.push({
      day: d,
      income: dayTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
      expense: Math.abs(dayTxs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount), 0)),
    })
  }

  const totalIncome = Number(income._sum.amount || 0)
  const totalExpenses = Math.abs(Number(expenses._sum.amount || 0))
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balanceAmount), 0)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  return Response.json({
    totalBalance,
    totalIncome,
    totalExpenses,
    savingsRate,
    accounts,
    categoryBreakdown: categoryData,
    dailyCashFlow: dailyData,
    recentTransactions,
  })
}
