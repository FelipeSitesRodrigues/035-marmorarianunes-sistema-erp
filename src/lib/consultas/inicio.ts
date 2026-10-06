import 'server-only'
import { sql } from '../db'
import type { Mes } from '../tempo'
import type { MaterialOpcao } from '../tipos'

export type ResumoMes = {
  entrou: number
  saiu: number
  vendido: number
  vendas: number
  comprado: number
  compras: number
  despesas: number
}

/**
 * O mês em dinheiro. "Entrou" e "Saiu" são o que foi pago de verdade no mês
 * (pela data do pagamento); "Vendido" é o valor das vendas feitas no mês,
 * recebidas ou não. Por isso venda a prazo aparece em Vendido e não em Entrou.
 */
export async function resumoDoMes(mes: Mes): Promise<ResumoMes> {
  const [caixa] = await sql<{ entrou: number; saiu: number }[]>`
    select coalesce(sum(valor) filter (where natureza = 'entrada'), 0) as entrou,
           coalesce(sum(valor) filter (where natureza = 'saida'), 0) as saiu
      from nunes.lancamentos
     where situacao = 'quitado' and quitado_em between ${mes.inicio} and ${mes.fim}
  `
  const ops = await sql<{ tipo: string; qtd: number; total: number }[]>`
    select tipo, count(*)::int as qtd, coalesce(sum(valor_total), 0) as total
      from nunes.operacoes
     where situacao = 'ativa' and tipo in ('venda', 'compra', 'despesa') and data between ${mes.inicio} and ${mes.fim}
     group by tipo
  `
  const de = (t: string) => ops.find((o) => o.tipo === t) ?? { qtd: 0, total: 0 }
  return {
    entrou: caixa.entrou,
    saiu: caixa.saiu,
    vendido: de('venda').total,
    vendas: de('venda').qtd,
    comprado: de('compra').total,
    compras: de('compra').qtd,
    despesas: de('despesa').total,
  }
}

type Contas = { total: number; pessoas: number; contas: number; atrasadas: number; proximo: string | null }
export type ContasAbertas = { receber: Contas; pagar: Contas }

/** O que está em aberto hoje, de qualquer mês. */
export async function contasEmAberto(hoje: string): Promise<ContasAbertas> {
  const linhas = await sql<
    ({ natureza: 'entrada' | 'saida' } & Contas)[]
  >`
    select l.natureza,
           sum(l.valor) as total,
           count(distinct coalesce(o.contraparte, o.descricao, o.id::text))::int as pessoas,
           count(*)::int as contas,
           count(*) filter (where l.vencimento < ${hoje}::date)::int as atrasadas,
           min(l.vencimento) filter (where l.vencimento >= ${hoje}::date) as proximo
      from nunes.lancamentos l
      join nunes.operacoes o on o.id = l.operacao_id
     where l.situacao = 'pendente'
     group by l.natureza
  `
  const vazio = { total: 0, pessoas: 0, contas: 0, atrasadas: 0, proximo: null }
  return {
    receber: linhas.find((l) => l.natureza === 'entrada') ?? vazio,
    pagar: linhas.find((l) => l.natureza === 'saida') ?? vazio,
  }
}

export type ResumoEstoque = { materiais: number; valor: number; repor: number; lista: MaterialOpcao[] }

/** Estoque baixo: chegou no mínimo ou abaixo dele (só quem tem mínimo definido). */
export async function resumoEstoque(limite = 4): Promise<ResumoEstoque> {
  const [r] = await sql<{ materiais: number; valor: number; repor: number }[]>`
    select count(*)::int as materiais,
           coalesce(sum(round(quantidade * custo_medio, 2)), 0) as valor,
           count(*) filter (where estoque_minimo > 0 and quantidade <= estoque_minimo)::int as repor
      from nunes.materiais
     where ativo
  `
  const lista = await sql<MaterialOpcao[]>`
    select id, nome, categoria, unidade, quantidade, estoque_minimo, custo_medio, fornecedor, observacoes, foto
      from nunes.materiais
     where ativo and estoque_minimo > 0 and quantidade <= estoque_minimo
     order by quantidade / estoque_minimo, nome
     limit ${limite}
  `
  return { ...r, lista }
}
