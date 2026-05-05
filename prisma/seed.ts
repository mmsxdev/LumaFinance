import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: 'Moradia', icon: '🏠', color: '#5DCAA5', type: 'EXPENSE' as const, keywords: ['aluguel', 'condomínio', 'iptu', 'luz', 'energia', 'água', 'gás', 'internet'] },
  { name: 'Alimentação', icon: '🛒', color: '#378ADD', type: 'EXPENSE' as const, keywords: ['supermercado', 'mercado', 'padaria', 'ifood', 'restaurante', 'lanche'] },
  { name: 'Transporte', icon: '🚗', color: '#EF9F27', type: 'EXPENSE' as const, keywords: ['uber', '99', 'combustível', 'gasolina', 'estacionamento', 'pedágio'] },
  { name: 'Saúde', icon: '💊', color: '#F0997B', type: 'EXPENSE' as const, keywords: ['farmácia', 'drogasil', 'consulta', 'médico', 'plano de saúde'] },
  { name: 'Lazer', icon: '🎬', color: '#9F7AEA', type: 'EXPENSE' as const, keywords: ['cinema', 'teatro', 'spotify', 'prime video', 'disney', 'viagem'] },
  { name: 'Educação', icon: '📚', color: '#63B3ED', type: 'EXPENSE' as const, keywords: ['escola', 'faculdade', 'curso', 'udemy', 'livro', 'alura'] },
  { name: 'Roupas', icon: '👗', color: '#FC8181', type: 'EXPENSE' as const, keywords: ['renner', 'riachuelo', 'zara', 'shein', 'roupa'] },
  { name: 'Pets', icon: '🐾', color: '#68D391', type: 'EXPENSE' as const, keywords: ['petshop', 'veterinário', 'ração', 'petz'] },
  { name: 'Finanças', icon: '💳', color: '#F6AD55', type: 'EXPENSE' as const, keywords: ['tarifa', 'taxa', 'juros', 'seguro', 'anuidade'] },
  { name: 'Assinaturas', icon: '📱', color: '#B794F4', type: 'EXPENSE' as const, keywords: ['netflix', 'spotify', 'youtube', 'amazon', 'disney'] },
  { name: 'Investimentos', icon: '📈', color: '#48BB78', type: 'INVESTMENT' as const, keywords: ['tesouro', 'cdb', 'lci', 'fundos', 'ações'] },
  { name: 'Salário', icon: '💼', color: '#1D9E75', type: 'INCOME' as const, keywords: ['salário', 'pagamento', 'holerite'] },
  { name: 'Freelance', icon: '💻', color: '#4299E1', type: 'INCOME' as const, keywords: ['freelance', 'projeto', 'consultoria'] },
  { name: 'Outros', icon: '📦', color: '#A0AEC0', type: 'EXPENSE' as const, keywords: [] },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Categories
  console.log('📦 Creating categories...')
  const categories: Record<string, string> = {}
  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      create: { ...cat, isSystem: true },
      update: {},
    })
    categories[cat.name] = created.id
  }

  // Demo User
  console.log('👤 Creating demo user...')
  const user = await prisma.user.upsert({
    where: { email: 'demo@lumafinance.app' },
    create: { email: 'demo@lumafinance.app', name: 'Miguel' },
    update: {},
  })

  // Demo Bank Accounts
  console.log('🏦 Creating demo accounts...')
  const nubank = await prisma.bankAccount.upsert({
    where: { id: 'demo-nubank' },
    create: {
      id: 'demo-nubank', userId: user.id, institutionId: 'nubank',
      institutionName: 'Nubank', institutionColor: '#8B5CF6',
      type: 'CHECKING', name: 'Nubank Conta', balanceAmount: 4250.00,
    },
    update: { balanceAmount: 4250.00 },
  })

  const itau = await prisma.bankAccount.upsert({
    where: { id: 'demo-itau' },
    create: {
      id: 'demo-itau', userId: user.id, institutionId: 'itau',
      institutionName: 'Itaú', institutionColor: '#003087',
      type: 'SAVINGS', name: 'Itaú Poupança', balanceAmount: 12800.00,
    },
    update: { balanceAmount: 12800.00 },
  })

  // Demo Transactions (current month and previous months)
  console.log('💳 Creating demo transactions...')
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const demoTransactions = [
    // Current month
    { desc: 'Salário', clean: 'Salário', amount: 8500, date: new Date(thisYear, thisMonth, 5), type: 'CREDIT', cat: 'Salário', acc: nubank.id },
    { desc: 'Freelance projeto web', clean: 'Freelance Web', amount: 2500, date: new Date(thisYear, thisMonth, 12), type: 'PIX', cat: 'Freelance', acc: nubank.id },
    { desc: 'Aluguel apartamento', clean: 'Aluguel', amount: -2200, date: new Date(thisYear, thisMonth, 1), type: 'BOLETO', cat: 'Moradia', acc: nubank.id },
    { desc: 'Condomínio', clean: 'Condomínio', amount: -450, date: new Date(thisYear, thisMonth, 5), type: 'BOLETO', cat: 'Moradia', acc: nubank.id },
    { desc: 'Conta de luz ENEL', clean: 'ENEL Energia', amount: -180, date: new Date(thisYear, thisMonth, 10), type: 'BOLETO', cat: 'Moradia', acc: nubank.id },
    { desc: 'Internet Vivo Fibra', clean: 'Vivo Internet', amount: -120, date: new Date(thisYear, thisMonth, 8), type: 'DEBIT', cat: 'Moradia', acc: nubank.id },
    { desc: 'Supermercado Extra', clean: 'Extra Supermercado', amount: -680, date: new Date(thisYear, thisMonth, 3), type: 'DEBIT', cat: 'Alimentação', acc: nubank.id },
    { desc: 'iFood pedidos', clean: 'iFood', amount: -245, date: new Date(thisYear, thisMonth, 7), type: 'DEBIT', cat: 'Alimentação', acc: nubank.id },
    { desc: 'Padaria Bella Vista', clean: 'Padaria', amount: -85, date: new Date(thisYear, thisMonth, 9), type: 'PIX', cat: 'Alimentação', acc: nubank.id },
    { desc: 'Carrefour compras', clean: 'Carrefour', amount: -520, date: new Date(thisYear, thisMonth, 15), type: 'DEBIT', cat: 'Alimentação', acc: nubank.id },
    { desc: 'Uber viagens', clean: 'Uber', amount: -190, date: new Date(thisYear, thisMonth, 6), type: 'PIX', cat: 'Transporte', acc: nubank.id },
    { desc: 'Shell combustível', clean: 'Shell Gasolina', amount: -280, date: new Date(thisYear, thisMonth, 11), type: 'DEBIT', cat: 'Transporte', acc: nubank.id },
    { desc: 'Drogasil medicamentos', clean: 'Drogasil', amount: -95, date: new Date(thisYear, thisMonth, 4), type: 'DEBIT', cat: 'Saúde', acc: nubank.id },
    { desc: 'Plano de saúde Unimed', clean: 'Unimed', amount: -450, date: new Date(thisYear, thisMonth, 1), type: 'DEBIT', cat: 'Saúde', acc: nubank.id },
    { desc: 'Netflix assinatura', clean: 'Netflix', amount: -55.90, date: new Date(thisYear, thisMonth, 2), type: 'DEBIT', cat: 'Assinaturas', acc: nubank.id },
    { desc: 'Spotify Premium', clean: 'Spotify', amount: -21.90, date: new Date(thisYear, thisMonth, 2), type: 'DEBIT', cat: 'Assinaturas', acc: nubank.id },
    { desc: 'Amazon Prime', clean: 'Amazon Prime', amount: -14.90, date: new Date(thisYear, thisMonth, 2), type: 'DEBIT', cat: 'Assinaturas', acc: nubank.id },
    { desc: 'Curso Alura', clean: 'Alura', amount: -85, date: new Date(thisYear, thisMonth, 1), type: 'DEBIT', cat: 'Educação', acc: nubank.id },
    { desc: 'Cinema Cinemark', clean: 'Cinemark', amount: -65, date: new Date(thisYear, thisMonth, 13), type: 'DEBIT', cat: 'Lazer', acc: nubank.id },
    { desc: 'Renner roupas', clean: 'Renner', amount: -320, date: new Date(thisYear, thisMonth, 14), type: 'DEBIT', cat: 'Roupas', acc: nubank.id },
    { desc: 'Tesouro Direto aplicação', clean: 'Tesouro Direto', amount: -1000, date: new Date(thisYear, thisMonth, 6), type: 'INVESTMENT', cat: 'Investimentos', acc: itau.id },

    // Previous month
    { desc: 'Salário', clean: 'Salário', amount: 8500, date: new Date(thisYear, thisMonth - 1, 5), type: 'CREDIT', cat: 'Salário', acc: nubank.id },
    { desc: 'Aluguel', clean: 'Aluguel', amount: -2200, date: new Date(thisYear, thisMonth - 1, 1), type: 'BOLETO', cat: 'Moradia', acc: nubank.id },
    { desc: 'Supermercado', clean: 'Supermercado', amount: -750, date: new Date(thisYear, thisMonth - 1, 8), type: 'DEBIT', cat: 'Alimentação', acc: nubank.id },
    { desc: 'iFood', clean: 'iFood', amount: -310, date: new Date(thisYear, thisMonth - 1, 12), type: 'DEBIT', cat: 'Alimentação', acc: nubank.id },
    { desc: 'Uber', clean: 'Uber', amount: -165, date: new Date(thisYear, thisMonth - 1, 10), type: 'PIX', cat: 'Transporte', acc: nubank.id },
    { desc: 'Gasolina', clean: 'Posto BR', amount: -250, date: new Date(thisYear, thisMonth - 1, 15), type: 'DEBIT', cat: 'Transporte', acc: nubank.id },
  ]

  for (const tx of demoTransactions) {
    await prisma.transaction.create({
      data: {
        accountId: tx.acc,
        description: tx.desc,
        cleanDescription: tx.clean,
        amount: tx.amount,
        date: tx.date,
        type: tx.type as any,
        categoryId: categories[tx.cat],
        aiCategorized: true,
        aiConfidence: 0.95,
        merchant: tx.clean,
      },
    })
  }

  // Demo Budgets (current month)
  console.log('📊 Creating demo budgets...')
  const budgetCategories = [
    { cat: 'Alimentação', amount: 1800 },
    { cat: 'Transporte', amount: 600 },
    { cat: 'Moradia', amount: 3000 },
    { cat: 'Lazer', amount: 300 },
    { cat: 'Saúde', amount: 600 },
  ]
  for (const b of budgetCategories) {
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id, categoryId: categories[b.cat],
          month: thisMonth + 1, year: thisYear,
        },
      },
      create: {
        userId: user.id, categoryId: categories[b.cat],
        amount: b.amount, month: thisMonth + 1, year: thisYear,
      },
      update: {},
    })
  }

  // Demo Goals
  console.log('🎯 Creating demo goals...')
  const demoGoals = [
    { name: 'Reserva de Emergência', desc: '6 meses de despesas', target: 30000, current: 12800, icon: '🛡️', color: '#06D6A0' },
    { name: 'Viagem Europa', desc: 'Férias 2027', target: 15000, current: 3200, icon: '✈️', color: '#8B5CF6' },
    { name: 'Macbook Pro', desc: 'Para trabalho remoto', target: 12000, current: 5500, icon: '💻', color: '#3B82F6' },
  ]
  for (const g of demoGoals) {
    await prisma.goal.upsert({
      where: { id: `demo-goal-${g.name.toLowerCase().replace(/\s/g, '-')}` },
      create: {
        id: `demo-goal-${g.name.toLowerCase().replace(/\s/g, '-')}`,
        userId: user.id, name: g.name, description: g.desc,
        targetAmount: g.target, currentAmount: g.current,
        icon: g.icon, color: g.color,
      },
      update: {},
    })
  }

  console.log('✅ Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
