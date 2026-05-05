import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create user with email matching the Supabase auth user
  const user = await prisma.user.upsert({
    where: { email: 'miguel@lumafinance.app' },
    create: { email: 'miguel@lumafinance.app', name: 'Miguel' },
    update: { name: 'Miguel' },
  })
  console.log('User created/updated:', user.id)

  // Find demo user and migrate their data to the real user
  const demo = await prisma.user.findUnique({ where: { email: 'demo@lumafinance.app' } })
  
  if (demo && demo.id !== user.id) {
    // Migrate accounts, budgets, goals from demo to real user
    const accounts = await prisma.bankAccount.updateMany({
      where: { userId: demo.id },
      data: { userId: user.id },
    })
    console.log(`Migrated ${accounts.count} accounts`)

    const budgets = await prisma.budget.updateMany({
      where: { userId: demo.id },
      data: { userId: user.id },
    })
    console.log(`Migrated ${budgets.count} budgets`)

    const goals = await prisma.goal.updateMany({
      where: { userId: demo.id },
      data: { userId: user.id },
    })
    console.log(`Migrated ${goals.count} goals`)

    console.log('✅ All demo data migrated to miguel@lumafinance.app')
  } else {
    console.log('No demo user found or already migrated')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
