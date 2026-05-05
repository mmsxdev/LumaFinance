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

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { transactions } = await request.json()
    
    if (!transactions || !Array.isArray(transactions)) {
      return Response.json({ error: 'Formato inválido. Esperado array de transações.' }, { status: 400 })
    }

    // Default account fallback
    let defaultAccountId = transactions[0]?.accountId
    if (!defaultAccountId) {
      const firstAccount = await prisma.bankAccount.findFirst({
        where: { userId, isActive: true },
        select: { id: true }
      })
      if (!firstAccount) return Response.json({ error: 'Nenhuma conta bancária encontrada.' }, { status: 400 })
      defaultAccountId = firstAccount.id
    }

    const dataToInsert = transactions.map((t: any) => ({
      accountId: t.accountId || defaultAccountId,
      description: t.description,
      amount: Number(t.amount),
      date: new Date(t.date),
      type: t.type || (Number(t.amount) >= 0 ? 'CREDIT' : 'DEBIT'),
      categoryId: t.categoryId || null,
      notes: t.notes || 'Importado via OFX/CSV',
      status: 'COMPLETED' as any
    }))

    const result = await prisma.transaction.createMany({
      data: dataToInsert,
      skipDuplicates: true, // Prisma handles basic unique constraint skips if any
    })

    return Response.json({ success: true, count: result.count }, { status: 201 })
  } catch (error: any) {
    console.error('Batch import error:', error)
    return Response.json({ error: 'Erro ao importar transações', details: error.message }, { status: 500 })
  }
}
