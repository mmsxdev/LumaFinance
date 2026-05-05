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

export async function GET() {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ goals })
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const goal = await prisma.goal.create({
    data: {
      userId,
      name: body.name,
      description: body.description || null,
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount || 0,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      icon: body.icon || '🎯',
      color: body.color || '#8B5CF6',
    },
  })

  return Response.json({ goal }, { status: 201 })
}
