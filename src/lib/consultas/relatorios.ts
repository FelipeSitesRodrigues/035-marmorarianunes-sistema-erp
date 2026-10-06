import 'server-only'
import { sql } from '../db'
import type { Unidade } from '../formatos'
import type { Periodo } from '../tempo'

export type DinheiroPeriodo = {
  vendas: number
  vendido: number
  compras: number
  comprado: number
  despesas: number
  despesasValor: number
  recebido: number
  pago: number
}

type LinhaPedra = { id: string; nome: string; unidade: Unidade; foto: string | null }

export type SaidaPedra = LinhaPedra & { vendida: number; obra: number; perda: number; outro: number; total: number; custo: number }
export type EntradaPedra = LinhaPedra & { quantidade: number; valor: number }
export type EstoquePedra = LinhaPedra & { quantidade_fim: number; estoque_minimo: number; custo_medio: number }

/**
 * Relatório de um período. Tudo pela data do lançamento, só o que vale
 * (corrigido e cancelado ficam de fora). Recebido e pago contam pela data em
 * que o dinheiro entrou ou saiu de verdade.
 */
export async function relatorio(p: Periodo) {
  const [dinheiro] = await sql<DinheiroPeriodo[]>`
    select
      (select count(*)::int from nunes.operacoes where situacao = 'ativa' and tipo = 'venda' and data between ${p.inicio} and ${p.fim}) as vendas,
      (select coalesce(sum(valor_total), 0) from nunes.operacoes where situacao = 'ativa' and tipo = 'venda' and data between ${p.inicio} and ${p.fim}) as vendido,
      (select count(*)::int from nunes.operacoes where situacao = 'ativa' and tipo = 'compra' and data between ${p.inicio} and ${p.fim}) as compras,
      (select coalesce(sum(valor_total), 0) from nunes.operacoes where situacao = 'ativa' and tipo = 'compra' and data between ${p.inicio} and ${p.fim}) as comprado,
      (select count(*)::int from nunes.operacoes where situacao = 'ativa' and tipo = 'despesa' and data between ${p.inicio} and ${p.fim}) as despesas,
      (select coalesce(sum(valor_total), 0) from nunes.operacoes where situacao = 'ativa' and tipo = 'despesa' and data between ${p.inicio} and ${p.fim}) as "despesasValor",
      (select coalesce(sum(valor), 0) from nunes.lancamentos where situacao = 'quitado' and natureza = 'entrada' and quitado_em between ${p.inicio} and ${p.fim}) as recebido,
      (select coalesce(sum(valor), 0) from nunes.lancamentos where situacao = 'quitado' and natureza = 'saida' and quitado_em between ${p.inicio} and ${p.fim}) as pago
  `

  const saidas = await sql<SaidaPedra[]>`
    select m.id, m.nome, m.unidade, m.foto,
           coalesce(sum(mv.quantidade) filter (where o.tipo = 'venda'), 0) as vendida,
           coalesce(sum(mv.quantidade) filter (where o.tipo = 'saida' and o.motivo = 'obra'), 0) as obra,
           coalesce(sum(mv.quantidade) filter (where o.tipo = 'saida' and o.motivo in ('perda', 'descarte')), 0) as perda,
           coalesce(sum(mv.quantidade) filter (where o.tipo = 'saida' and o.motivo = 'outro'), 0) as outro,
           sum(mv.quantidade) as total,
           sum(round(mv.quantidade * mv.custo_unitario, 2)) as custo
      from nunes.movimentos mv
      join nunes.operacoes o on o.id = mv.operacao_id
      join nunes.materiais m on m.id = mv.material_id
     where not mv.estorno and mv.sentido = -1 and o.situacao = 'ativa' and o.tipo in ('venda', 'saida')
       and o.data between ${p.inicio} and ${p.fim}
     group by m.id
     order by total desc, m.nome
  `

  const entradas = await sql<EntradaPedra[]>`
    select m.id, m.nome, m.unidade, m.foto,
           sum(mv.quantidade) as quantidade,
           sum(round(mv.quantidade * mv.custo_unitario, 2)) as valor
      from nunes.movimentos mv
      join nunes.operacoes o on o.id = mv.operacao_id
      join nunes.materiais m on m.id = mv.material_id
     where not mv.estorno and mv.sentido = 1 and o.situacao = 'ativa' and o.tipo = 'compra'
       and o.data between ${p.inicio} and ${p.fim}
     group by m.id
     order by valor desc, m.nome
  `

  // Quanto tinha no fim do período: o de hoje menos o que mexeu depois
  const estoque = await sql<EstoquePedra[]>`
    select m.id, m.nome, m.unidade, m.foto, m.estoque_minimo, m.custo_medio,
           m.quantidade - coalesce((
             select sum(mv.sentido * mv.quantidade)
               from nunes.movimentos mv
               join nunes.operacoes o on o.id = mv.operacao_id
              where mv.material_id = m.id and o.data > ${p.fim}
           ), 0) as quantidade_fim
      from nunes.materiais m
     where m.ativo and m.criado_em::date <= ${p.fim}::date
     order by m.nome
  `

  return { dinheiro, saidas, entradas, estoque }
}
