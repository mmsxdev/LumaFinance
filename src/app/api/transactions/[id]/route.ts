import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/transactions/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(body.description && { description: body.description }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.date && { date: new Date(body.date) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.type && { type: body.type }),
    },
    include: { category: true },
  })

  return Response.json({ transaction })
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/transactions/[id]'>) {
  const { id } = await ctx.params
  await prisma.transaction.delete({ where: { id } })
  return Response.json({ success: true })
}
