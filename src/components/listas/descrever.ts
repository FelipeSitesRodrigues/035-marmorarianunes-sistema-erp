import { dataCurta, numeroBR, qtd, reais, UNIDADES } from '@/lib/formatos'
import type { OperacaoLinha } from '@/lib/tipos'

/* Como cada operação aparece numa lista, em palavras. */

export type Tom = 'verde' | 'ambar' | 'vermelha' | 'cinza' | 'pedra'

export const PREPOSICAO_FORMA: Record<string, string> = {
  Pix: 'no Pix',
  Dinheiro: 'em dinheiro',
  Cartão: 'no cartão',
  Transferência: 'por transferência',
  Boleto: 'no boleto',
}

const comForma = (forma: string | null) => (forma ? ` ${PREPOSICAO_FORMA[forma] ?? `(${forma})`}` : '')

export const ROTULO_MOTIVO: Record<string, string> = {
  obra: 'Saída para obra',
  perda: 'Perda',
  descarte: 'Descarte',
  outro: 'Saída',
}

export function rotuloTipo(op: Pick<OperacaoLinha, 'tipo' | 'motivo'>): { texto: string; tom: Tom } {
  switch (op.tipo) {
    case 'venda':
      return { texto: 'Venda', tom: 'vermelha' }
    case 'compra':
      return { texto: 'Compra', tom: 'cinza' }
    case 'saida':
      return { texto: ROTULO_MOTIVO[op.motivo ?? 'outro'] ?? 'Saída', tom: 'pedra' }
    case 'despesa':
      return { texto: 'Despesa', tom: 'cinza' }
    case 'cadastro':
      return { texto: 'Cadastro', tom: 'cinza' }
    case 'ajuste':
      return { texto: 'Ajuste', tom: 'cinza' }
  }
}

export function textoItens(op: Pick<OperacaoLinha, 'itens' | 'tipo'>) {
  return op.itens
    .map((i) =>
      op.tipo === 'ajuste'
        ? `${i.nome}, ${i.sentido > 0 ? '+' : '−'}${numeroBR(i.quantidade)} ${UNIDADES[i.unidade]?.plural ?? i.unidade}`
        : `${i.nome}, ${qtd(i.quantidade, i.unidade)}`,
    )
    .join(' e ')
}

export function descricao(op: OperacaoLinha) {
  const itens = textoItens(op)
  switch (op.tipo) {
    case 'venda':
      return `${itens ? `${itens}, ` : ''}para ${op.contraparte ?? 'cliente'}${op.referencia ? ` (${op.referencia})` : ''}`
    case 'compra':
      return `${itens}${op.contraparte ? `, de ${op.contraparte}` : ''}`
    case 'saida':
      return `${itens}${op.referencia ? `, ${op.referencia}` : ''}`
    case 'despesa':
      return `${op.descricao ?? op.categoria ?? 'Despesa'}${op.contraparte ? `, ${op.contraparte}` : ''}`
    case 'cadastro':
      return itens ? `${itens} (estoque inicial)` : `${op.descricao}, sem estoque inicial`
    case 'ajuste':
      return `${itens}${op.motivo ? ` (${op.motivo})` : ''}`
  }
}

export function situacao(op: OperacaoLinha, hoje: string): { texto: string; tom: Tom } {
  if (op.situacao === 'cancelada') return { texto: 'Cancelado', tom: 'cinza' }
  if (op.situacao === 'corrigida') return { texto: 'Corrigido', tom: 'cinza' }
  const atrasado = op.vencimento && op.vencimento < hoje
  if (op.tipo === 'venda') {
    if (op.pendente > 0)
      return atrasado
        ? { texto: `Atrasado desde ${dataCurta(op.vencimento!)}`, tom: 'ambar' }
        : { texto: `A receber até ${dataCurta(op.vencimento!)}`, tom: 'ambar' }
    return { texto: `Recebido${comForma(op.forma)}`, tom: 'verde' }
  }
  if (op.tipo === 'compra' || op.tipo === 'despesa') {
    if (op.pendente > 0)
      return atrasado
        ? { texto: `Venceu em ${dataCurta(op.vencimento!)}`, tom: 'ambar' }
        : { texto: `A pagar até ${dataCurta(op.vencimento!)}`, tom: 'ambar' }
    if (op.valor_total === 0) return { texto: 'Sem valor', tom: 'cinza' }
    return { texto: `Pago${comForma(op.forma)}`, tom: 'verde' }
  }
  if (op.tipo === 'saida') {
    if (op.motivo === 'obra') return { texto: 'Uso na obra', tom: 'verde' }
    if (op.motivo === 'perda') return { texto: 'Perdeu', tom: 'cinza' }
    if (op.motivo === 'descarte') return { texto: 'Descartado', tom: 'cinza' }
    return { texto: 'Saiu do estoque', tom: 'cinza' }
  }
  if (op.tipo === 'cadastro') return { texto: 'Estoque inicial', tom: 'cinza' }
  return { texto: 'Contagem', tom: 'cinza' }
}

/** Valor da linha, ou null quando a operação não mexe em dinheiro. */
export function valorDaLinha(op: OperacaoLinha) {
  if (op.tipo === 'venda' || op.tipo === 'compra' || op.tipo === 'despesa') return reais(op.valor_total)
  return null
}
