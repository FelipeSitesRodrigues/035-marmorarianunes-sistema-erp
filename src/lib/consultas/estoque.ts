import 'server-only'
import { sql } from '../db'
import type { MaterialOpcao, TipoOperacao } from '../tipos'

export async function materialPorId(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const [m] = await sql<(MaterialOpcao & { ativo: boolean; criado_em: string })[]>`
    select id, nome, categoria, unidade, quantidade, estoque_minimo, custo_medio, fornecedor, observacoes, foto, ativo, criado_em
      from nunes.materiais where id = ${id}
  `
  return m ?? null
}

export type MovimentoMaterial = {
  id: number
  sentido: 1 | -1
  quantidade: number
  saldo_depois: number
  custo_unitario: number
  estorno: boolean
  criado_em: string
  numero: number
  tipo: TipoOperacao
  data: string
  motivo: string | null
  contraparte: string | null
  referencia: string | null
  situacao: 'ativa' | 'corrigida' | 'cancelada'
}

export async function movimentosDoMaterial(id: string, limite = 120) {
  return sql<MovimentoMaterial[]>`
    select m.id, m.sentido, m.quantidade, m.saldo_depois, m.custo_unitario, m.estorno, m.criado_em,
           o.numero, o.tipo, o.data, o.motivo, o.contraparte, o.referencia, o.situacao
      from nunes.movimentos m
      join nunes.operacoes o on o.id = m.operacao_id
     where m.material_id = ${id}
     order by m.id desc
     limit ${limite}
  `
}

/** Quanto já foi gasto comprando essa pedra (compras que valem). */
export async function totalComprado(id: string) {
  const [r] = await sql<{ total: number; quantidade: number }[]>`
    select coalesce(sum(round(m.quantidade * m.custo_unitario, 2)), 0) as total,
           coalesce(sum(m.quantidade), 0) as quantidade
      from nunes.movimentos m
      join nunes.operacoes o on o.id = m.operacao_id
     where m.material_id = ${id} and not m.estorno and m.sentido = 1 and o.tipo = 'compra' and o.situacao = 'ativa'
  `
  return r
}
