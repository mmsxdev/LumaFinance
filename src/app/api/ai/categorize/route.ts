import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateStructuredResponse } from '@/lib/gemini'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getUserId() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  return dbUser?.id || null
}

interface CategorizationResult {
  transactionId: string
  categoryId: string
  cleanDescription: string
  merchant?: string
  confidence: number
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { transactionIds } = await request.json()

  // Get uncategorized transactions
  const where: any = {
    account: { userId },
    aiCategorized: false,
  }
  if (transactionIds?.length) {
    where.id = { in: transactionIds }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    take: 30,
  })

  if (transactions.length === 0) {
    return Response.json({ message: 'Nenhuma transação para categorizar', count: 0 })
  }

  const categories = await prisma.category.findMany()

  const categoryList = categories
    .map(c => `- ID: "${c.id}" | Nome: "${c.name}" | Tipo: ${c.type} | Keywords: ${c.keywords.join(', ')}`)
    .join('\n')

  const txList = transactions
    .map((tx, i) =>
      `${i + 1}. ID: "${tx.id}" | Descrição: "${tx.description}" | Valor: ${Number(tx.amount) > 0 ? '+' : ''}R$ ${Math.abs(Number(tx.amount)).toFixed(2)} | Data: ${tx.date.toISOString().split('T')[0]}`
    )
    .join('\n')

  const systemInstruction = `Você é um sistema de categorização de transações financeiras brasileiras. Retorne APENAS um array JSON válido.`

  const prompt = `Categorize as transações abaixo nas categorias disponíveis.

CATEGORIAS:
${categoryList}

REGRAS:
1. Valor POSITIVO = crédito (Salário, Freelance)
2. Valor NEGATIVO = débito (Despesas)
3. Analise descrição e valor
4. Para ambíguas, use "Outros"
5. Extraia nome limpo do estabelecimento

TRANSAÇÕES:
${txList}

Retorne array JSON:
[{"transactionId": "id", "categoryId": "id-da-categoria", "cleanDescription": "Nome limpo", "merchant": "Estabelecimento", "confidence": 0.95}]`

  try {
    const results = await generateStructuredResponse<CategorizationResult[]>(prompt, systemInstruction)

    // Update transactions in DB
    for (const result of results) {
      await prisma.transaction.update({
        where: { id: result.transactionId },
        data: {
          categoryId: result.categoryId,
          cleanDescription: result.cleanDescription,
          merchant: result.merchant,
          aiCategorized: true,
          aiConfidence: result.confidence,
        },
      })
    }

    return Response.json({ message: 'Categorização concluída', count: results.length })
  } catch (error) {
    console.error('AI categorization error:', error)
    return Response.json({ error: 'Erro na categorização' }, { status: 500 })
  }
}
