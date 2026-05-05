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

  const accounts = await prisma.bankAccount.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balanceAmount), 0)

  return Response.json({ accounts, totalBalance })
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const account = await prisma.bankAccount.create({
    data: {
      userId,
      institutionId: body.institutionId,
      institutionName: body.institutionName,
      institutionColor: body.institutionColor || '#888888',
      type: body.type || 'CHECKING',
      name: body.name,
      number: body.number || null,
      agency: body.agency || null,
      balanceAmount: body.balanceAmount || 0,
    },
  })

  return Response.json({ account }, { status: 201 })
}
