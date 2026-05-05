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
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const where: any = {
    account: { userId },
    date: { gte: startDate, lte: endDate },
    status: 'COMPLETED',
  }

  if (categoryId) where.categoryId = categoryId
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { cleanDescription: { contains: search, mode: 'insensitive' } },
      { merchant: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: { select: { institutionName: true, institutionColor: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return Response.json({ transactions, total, page, limit })
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const transaction = await prisma.transaction.create({
    data: {
      accountId: body.accountId,
      description: body.description,
      amount: body.amount,
      date: new Date(body.date),
      type: body.type || 'DEBIT',
      categoryId: body.categoryId || null,
      notes: body.notes || null,
    },
    include: { category: true },
  })

  return Response.json({ transaction }, { status: 201 })
}
