export const DEFAULT_CATEGORIES = [
  { name: 'Moradia', icon: '🏠', color: '#5DCAA5', type: 'EXPENSE' as const, keywords: ['aluguel', 'condomínio', 'iptu', 'luz', 'energia', 'água', 'gás', 'internet', 'netflix', 'habitação'] },
  { name: 'Alimentação', icon: '🛒', color: '#378ADD', type: 'EXPENSE' as const, keywords: ['supermercado', 'mercado', 'padaria', 'açougue', 'hortifruti', 'extra', 'carrefour', 'ifood', 'restaurante', 'lanche', 'pizza'] },
  { name: 'Transporte', icon: '🚗', color: '#EF9F27', type: 'EXPENSE' as const, keywords: ['uber', '99', 'taxi', 'combustível', 'gasolina', 'estacionamento', 'pedágio', 'metro', 'ônibus'] },
  { name: 'Saúde', icon: '💊', color: '#F0997B', type: 'EXPENSE' as const, keywords: ['farmácia', 'drogasil', 'consulta', 'médico', 'hospital', 'plano de saúde', 'exame'] },
  { name: 'Lazer', icon: '🎬', color: '#9F7AEA', type: 'EXPENSE' as const, keywords: ['cinema', 'teatro', 'show', 'spotify', 'prime video', 'disney', 'jogo', 'steam', 'viagem', 'hotel'] },
  { name: 'Educação', icon: '📚', color: '#63B3ED', type: 'EXPENSE' as const, keywords: ['escola', 'faculdade', 'curso', 'udemy', 'livro', 'mensalidade', 'alura'] },
  { name: 'Roupas', icon: '👗', color: '#FC8181', type: 'EXPENSE' as const, keywords: ['renner', 'riachuelo', 'zara', 'shein', 'roupa', 'calçado', 'tênis'] },
  { name: 'Pets', icon: '🐾', color: '#68D391', type: 'EXPENSE' as const, keywords: ['petshop', 'veterinário', 'ração', 'petz'] },
  { name: 'Finanças', icon: '💳', color: '#F6AD55', type: 'EXPENSE' as const, keywords: ['tarifa', 'taxa', 'juros', 'seguro', 'anuidade', 'empréstimo'] },
  { name: 'Assinaturas', icon: '📱', color: '#B794F4', type: 'EXPENSE' as const, keywords: ['netflix', 'spotify', 'youtube', 'amazon', 'disney', 'hbo', 'apple'] },
  { name: 'Investimentos', icon: '📈', color: '#48BB78', type: 'INVESTMENT' as const, keywords: ['tesouro', 'cdb', 'lci', 'lca', 'fundos', 'ações', 'previdência'] },
  { name: 'Salário', icon: '💼', color: '#1D9E75', type: 'INCOME' as const, keywords: ['salário', 'pagamento', 'holerite', 'remuneração'] },
  { name: 'Freelance', icon: '💻', color: '#4299E1', type: 'INCOME' as const, keywords: ['freelance', 'projeto', 'consultoria', 'serviço'] },
  { name: 'Outros', icon: '📦', color: '#A0AEC0', type: 'EXPENSE' as const, keywords: [] },
]

export const INSTITUTIONS = [
  { id: 'nubank', name: 'Nubank', color: '#8B5CF6', icon: '💜' },
  { id: 'itau', name: 'Itaú', color: '#003087', icon: '🟠' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC0000', icon: '🔴' },
  { id: 'bb', name: 'Banco do Brasil', color: '#FFCC00', icon: '🟡' },
  { id: 'caixa', name: 'Caixa', color: '#005CA9', icon: '🔵' },
  { id: 'inter', name: 'Inter', color: '#FF7A00', icon: '🟠' },
  { id: 'c6', name: 'C6 Bank', color: '#242424', icon: '⚫' },
  { id: 'santander', name: 'Santander', color: '#EC0000', icon: '🔴' },
  { id: 'manual', name: 'Conta Manual', color: '#6B7280', icon: '📝' },
]

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
