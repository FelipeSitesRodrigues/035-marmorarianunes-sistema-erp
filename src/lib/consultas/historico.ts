import 'server-only'
import { sql } from '../db'
import type { OperacaoLinha, Resumo } from '../tipos'
import type { Unidade } from '../formatos'

export type OperacaoDetalhe = OperacaoLinha & {
  motivo_alteracao: string | null
  alterada_em: string | null
  alterada_por_nome: string | null
  numero_substitui: number | null
  numero_substituida: number | null
}

export async function operacaoPorNumero(numero: number) {
  if (!Number.isInteger(numero) || numero <= 0) return null
  const [op] = await sql<OperacaoDetalhe[]>`
    select v.id, v.numero, v.tipo, v.data, v.criado_em, v.contraparte, v.referencia, v.motivo, v.categoria,
           v.descricao, v.valor_total, v.observacoes, v.situacao, v.substitui_id, v.substituida_por, v.itens,
           v.quitado, v.pendente, v.vencimento, v.forma, v.criado_por_nome, v.motivo_alteracao, v.alterada_em,
           ua.nome as alterada_por_nome, os.numero as numero_substitui, on2.numero as numero_substituida
      from nunes.v_operacoes v
      left join nunes.operacoes o on o.id = v.id
      left join nunes.usuarios ua on ua.id = o.alterada_por
      left join nunes.operacoes os on os.id = v.substitui_id
      left join nunes.operacoes on2 on on2.id = v.substituida_por
     where v.numero = ${numero}
  `
  return op ?? null
}

export type LancamentoDetalhe = {
  id: string
  natureza: 'entrada' | 'saida'
  valor: number
  vencimento: string
  situacao: 'pendente' | 'quitado' | 'cancelado'
  quitado_em: string | null
  forma_pagamento: string | null
}

export async function lancamentosDa(operacaoId: string) {
  return sql<LancamentoDetalhe[]>`
    select id, natureza, valor, vencimento, situacao, quitado_em, forma_pagamento
      from nunes.lancamentos
     where operacao_id = ${operacaoId}
     order by case situacao when 'quitado' then 0 when 'pendente' then 1 else 2 end, quitado_em, vencimento
  `
}

export type MovimentoDetalhe = {
  id: number
  material_id: string
  nome: string
  unidade: Unidade
  foto: string | null
  sentido: 1 | -1
  quantidade: number
  saldo_depois: number
  estorno: boolean
}

export async function movimentosDa(operacaoId: string) {
  return sql<MovimentoDetalhe[]>`
    select mv.id, mv.material_id, m.nome, m.unidade, m.foto, mv.sentido, mv.quantidade, mv.saldo_depois, mv.estorno
      from nunes.movimentos mv
      join nunes.materiais m on m.id = mv.material_id
     where mv.operacao_id = ${operacaoId}
     order by mv.id
  `
}

export type Evento = {
  id: number
  acao: string
  criado_em: string
  usuario: string | null
  detalhes: Record<string, unknown>
}

export async function eventosDa(operacaoId: string) {
  return sql<Evento[]>`
    select e.id, e.acao, e.criado_em, u.nome as usuario, e.detalhes
      from nunes.eventos e
      left join nunes.usuarios u on u.id = e.usuario_id
     where e.operacao_id = ${operacaoId}
     order by e.id
  `
}

/** A correção que gerou esta operação: o antes e o depois guardados no evento. */
export async function correcaoQueGerou(substituiId: string) {
  const [e] = await sql<{ detalhes: { antes: Resumo; depois: Resumo; motivo: string | null } }[]>`
    select detalhes from nunes.eventos where operacao_id = ${substituiId} and acao = 'corrigiu' order by id desc limit 1
  `
  return e?.detalhes ?? null
}
