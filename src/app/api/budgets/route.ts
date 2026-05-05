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

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  })

  // Calculate spent per category
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const spending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      account: { userId },
      date: { gte: startDate, lte: endDate },
      amount: { lt: 0 },
      status: 'COMPLETED',
    },
    _sum: { amount: true },
  })

  const budgetsWithSpent = budgets.map((b) => {
    const spent = spending.find((s) => s.categoryId === b.categoryId)
    return {
      ...b,
      spent: Math.abs(Number(spent?._sum.amount || 0)),
      percentage: Number(b.amount) > 0
        ? Math.abs(Number(spent?._sum.amount || 0)) / Number(b.amount) * 100
        : 0,
    }
  })

  return Response.json({ budgets: budgetsWithSpent })
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: body.categoryId,
        month: body.month,
        year: body.year,
      },
    },
    create: {
      userId,
      categoryId: body.categoryId,
      amount: body.amount,
      month: body.month,
      year: body.year,
      alertAt: body.alertAt || 0.8,
    },
    update: {
      amount: body.amount,
      alertAt: body.alertAt || 0.8,
    },
    include: { category: true },
  })

  return Response.json({ budget }, { status: 201 })
}
