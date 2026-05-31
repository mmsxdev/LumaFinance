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

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/goals/[id]'>) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()

  // Verify goal belongs to user
  const existing = await prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) return Response.json({ error: 'Meta não encontrada' }, { status: 404 })

  // Handle addAmount: increment currentAmount by the given value
  let newCurrentAmount: number | undefined
  if (body.addAmount !== undefined) {
    newCurrentAmount = Number(existing.currentAmount) + Number(body.addAmount)
  } else if (body.currentAmount !== undefined) {
    newCurrentAmount = Number(body.currentAmount)
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.targetAmount !== undefined && { targetAmount: body.targetAmount }),
      ...(newCurrentAmount !== undefined && { currentAmount: newCurrentAmount }),
      ...(body.targetDate !== undefined && { targetDate: body.targetDate ? new Date(body.targetDate) : null }),
      ...(body.icon && { icon: body.icon }),
      ...(body.color && { color: body.color }),
      ...(body.status && { status: body.status }),
    },
  })

  return Response.json({ goal })
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/goals/[id]'>) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  // Verify goal belongs to user
  const existing = await prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) return Response.json({ error: 'Meta não encontrada' }, { status: 404 })

  await prisma.goal.delete({ where: { id } })
  return Response.json({ success: true })
}
