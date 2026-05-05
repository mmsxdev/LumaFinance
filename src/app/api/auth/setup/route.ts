import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { name, email } = await request.json()

  const user = await prisma.user.upsert({
    where: { email },
    create: { name, email },
    update: { name },
  })

  return Response.json({ user })
}
