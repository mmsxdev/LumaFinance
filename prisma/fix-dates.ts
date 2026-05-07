import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDates() {
  // The previous script incorrectly added +1 day.
  // The real fix was just setting hours to 12:00 UTC (not adding a day).
  // All transactions now have hours=12 and are +1 day ahead. 
  // We need to subtract 1 day from all of them.
  
  const transactions = await prisma.transaction.findMany({
    select: { id: true, date: true, description: true }
  })

  let fixed = 0
  for (const tx of transactions) {
    const corrected = new Date(tx.date)
    corrected.setUTCDate(corrected.getUTCDate() - 1)
    corrected.setUTCHours(12, 0, 0, 0)
    
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { date: corrected }
    })
    fixed++
    console.log(`  ✓ ${tx.description?.substring(0, 40).padEnd(40)} | ${tx.date.toISOString().split('T')[0]} → ${corrected.toISOString().split('T')[0]}`)
  }

  console.log(`\nCorrigidas ${fixed} de ${transactions.length} transações.`)
  await prisma.$disconnect()
}

fixDates().catch(console.error)
