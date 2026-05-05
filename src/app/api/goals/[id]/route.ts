import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/goals/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.targetAmount !== undefined && { targetAmount: body.targetAmount }),
      ...(body.currentAmount !== undefined && { currentAmount: body.currentAmount }),
      ...(body.targetDate !== undefined && { targetDate: body.targetDate ? new Date(body.targetDate) : null }),
      ...(body.icon && { icon: body.icon }),
      ...(body.color && { color: body.color }),
      ...(body.status && { status: body.status }),
    },
  })

  return Response.json({ goal })
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/goals/[id]'>) {
  const { id } = await ctx.params
  await prisma.goal.delete({ where: { id } })
  return Response.json({ success: true })
}
