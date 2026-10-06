/*
 * Números, quantidades e datas do jeito que a Val fala.
 * Serve no servidor e no navegador.
 */

export type Unidade = 'chapa' | 'm2' | 'metro' | 'unidade' | 'peca' | 'caixa' | 'kg' | 'litro'

export const UNIDADES: Record<Unidade, { singular: string; plural: string; nome: string }> = {
  chapa: { singular: 'chapa', plural: 'chapas', nome: 'Chapa' },
  m2: { singular: 'm²', plural: 'm²', nome: 'm²' },
  metro: { singular: 'metro', plural: 'metros', nome: 'Metro' },
  unidade: { singular: 'unidade', plural: 'unidades', nome: 'Unidade' },
  peca: { singular: 'peça', plural: 'peças', nome: 'Peça' },
  caixa: { singular: 'caixa', plural: 'caixas', nome: 'Caixa' },
  kg: { singular: 'kg', plural: 'kg', nome: 'Quilo (kg)' },
  litro: { singular: 'litro', plural: 'litros', nome: 'Litro' },
}

export const CATEGORIAS = ['Granito', 'Mármore', 'Quartzito', 'Sinterizado', 'Insumo', 'Outro'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const FORMAS = ['Pix', 'Dinheiro', 'Cartão', 'Transferência', 'Boleto'] as const

export const CATEGORIAS_DESPESA = [
  'Frete',
  'Energia',
  'Água',
  'Aluguel',
  'Salário',
  'Manutenção',
  'Impostos',
  'Outras',
] as const

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })
const numero2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** R$ 17.060,00 (com espaço comum, não o espaço fino do Intl, que quebra em alguns lugares) */
export const reais = (valor: number) => moeda.format(valor).replace(/ /g, ' ')

/** 4.200,00 sem o R$, pra campo de dinheiro */
export const valorCampo = (valor: number) => numero2.format(valor)

export const numeroBR = (valor: number) => numero.format(valor)

export function nomeUnidade(unidade: Unidade, quantidade: number) {
  const u = UNIDADES[unidade] ?? { singular: unidade, plural: unidade }
  return Math.abs(quantidade) === 1 ? u.singular : u.plural
}

/** "2 chapas", "42,5 m²", "1 unidade" */
export const qtd = (quantidade: number, unidade: Unidade) => `${numeroBR(quantidade)} ${nomeUnidade(unidade, quantidade)}`

/**
 * Lê o que a Val digitou num campo de dinheiro ou de quantidade:
 * "4.200,00", "4200", "4200,5", "42.5" e "1.250" (milhar) viram número.
 */
export function lerNumero(texto: string): number | null {
  const limpo = texto.replace(/[R$\s]/g, '')
  if (!limpo) return null
  let normal: string
  if (limpo.includes(',')) {
    normal = limpo.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    normal = limpo.replace(/\./g, '')
  } else {
    normal = limpo
  }
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------------------
// Datas ("AAAA-MM-DD", sempre texto: nada de Date em UTC trocando o dia)
// ---------------------------------------------------------------------------

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const partes = (iso: string) => iso.slice(0, 10).split('-').map(Number) as [number, number, number]

/** 06/10 */
export function dataCurta(iso: string) {
  const [, m, d] = partes(iso)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

/** 06/10/2026 */
export function dataCompleta(iso: string) {
  const [a, m, d] = partes(iso)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`
}

/** Terça-feira, 6 de outubro de 2026 */
export function dataPorExtenso(iso: string) {
  const [a, m, d] = partes(iso)
  const semana = DIAS_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]
  return `${semana}, ${d} de ${MESES[m - 1]} de ${a}`
}

/** Diferença em dias entre duas datas ISO (b - a) */
export function diasEntre(a: string, b: string) {
  const [a1, a2, a3] = partes(a)
  const [b1, b2, b3] = partes(b)
  return Math.round((Date.UTC(b1, b2 - 1, b3) - Date.UTC(a1, a2 - 1, a3)) / 86_400_000)
}

/** "Hoje", "Ontem" ou "06/10" */
export function diaRelativo(iso: string, hoje: string) {
  const d = diasEntre(iso, hoje)
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Ontem'
  return dataCurta(iso)
}

/** Situação de uma conta em aberto, em palavras */
export function prazo(vencimento: string, hoje: string) {
  const d = diasEntre(hoje, vencimento)
  if (d < -1) return { texto: `Venceu há ${-d} dias`, atrasada: true, perto: false }
  if (d === -1) return { texto: 'Venceu ontem', atrasada: true, perto: false }
  if (d === 0) return { texto: 'Vence hoje', atrasada: false, perto: true }
  if (d === 1) return { texto: 'Vence amanhã', atrasada: false, perto: true }
  return { texto: `Até ${dataCurta(vencimento)}`, atrasada: false, perto: false }
}
