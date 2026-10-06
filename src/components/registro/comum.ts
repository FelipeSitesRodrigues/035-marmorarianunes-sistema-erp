import { numeroBR } from '@/lib/formatos'
import type { Contatos, MaterialOpcao, OperacaoParaCorrigir } from '@/lib/tipos'
import { itemVazio, type Item } from './Itens'

/* Props que todo formulário recebe da Gaveta. */
export type PropsForm = {
  materiais: MaterialOpcao[]
  contatos: Contatos
  hoje: string
  materialInicial?: string | null
  correcao?: OperacaoParaCorrigir | null
  onFechar: () => void
}

/**
 * Na correção, o estoque disponível conta com a pedra do lançamento original
 * de volta: corrigir uma venda de 2 chapas pra 3 precisa enxergar as 2 que
 * vão voltar antes de a nova sair. Numa compra é o contrário: as que tinham
 * entrado saem antes.
 */
export function estoqueNaCorrecao(materiais: MaterialOpcao[], correcao: OperacaoParaCorrigir | null | undefined) {
  if (!correcao) return materiais
  const sinal = correcao.tipo === 'compra' ? -1 : 1
  return materiais.map((m) => {
    const original = correcao.itens.filter((i) => i.material_id === m.id).reduce((t, i) => t + i.quantidade, 0)
    return original ? { ...m, quantidade: Math.round((m.quantidade + sinal * original) * 1000) / 1000 } : m
  })
}

export function itensIniciais(correcao: OperacaoParaCorrigir | null | undefined, materialInicial?: string | null): Item[] {
  if (correcao) {
    return correcao.itens.map((i) => ({
      ...itemVazio(i.material_id),
      quantidade: numeroBR(i.quantidade),
      valor: i.valor_unitario ? numeroBR(i.valor_unitario) : '',
      total: i.valor_unitario ? numeroBR(Math.round(i.quantidade * i.valor_unitario * 100) / 100) : '',
    }))
  }
  return [itemVazio(materialInicial ?? null)]
}

export const sugestoes = (...listas: string[][]) => [...new Set(listas.flat())]
