import 'server-only'
import { sql } from '../db'
import type { Mes } from '../tempo'
import type { OperacaoLinha, TipoOperacao } from '../tipos'

export type ContaAberta = {
  id: string
  natureza: 'entrada' | 'saida'
  valor: number
  vencimento: string
  numero: number
  tipo: TipoOperacao
  contraparte: string | null
  referencia: string | null
  descricao: string | null
  categoria: string | null
  itens: OperacaoLinha['itens']
  forma_prevista: string | null
}

export async function contasAbertas() {
  return sql<ContaAberta[]>`
    select l.id, l.natureza, l.valor, l.vencimento, l.forma_pagamento as forma_prevista,
           o.numero, o.tipo, o.contraparte, o.referencia, o.descricao, o.categoria, o.itens
      from nunes.lancamentos l
      join nunes.v_operacoes o on o.id = l.operacao_id
     where l.situacao = 'pendente'
     order by l.vencimento, o.numero
  `
}

export type MovimentoDinheiro = {
  id: string
  natureza: 'entrada' | 'saida'
  valor: number
  situacao: 'pendente' | 'quitado'
  quando: string
  forma_pagamento: string | null
  vencimento: string
  numero: number
  tipo: TipoOperacao
  data_operacao: string
  contraparte: string | null
  referencia: string | null
  descricao: string | null
  categoria: string | null
  itens: OperacaoLinha['itens']
  corrigido: boolean
}

/**
 * O dinheiro do mês: o que foi pago ou recebido no mês (pela data do
 * pagamento) e o que ficou em aberto de lançamentos feitos no mês.
 */
export async function dinheiroDoMes(mes: Mes, ver: string | undefined) {
  return sql<MovimentoDinheiro[]>`
    select l.id, l.natureza, l.valor, l.situacao, coalesce(l.quitado_em, o.data) as quando,
           l.forma_pagamento, l.vencimento, o.numero, o.tipo, o.data as data_operacao,
           o.contraparte, o.referencia, o.descricao, o.categoria, o.itens, o.substitui_id is not null as corrigido
      from nunes.lancamentos l
      join nunes.v_operacoes o on o.id = l.operacao_id
     where ((l.situacao = 'quitado' and l.quitado_em between ${mes.inicio} and ${mes.fim})
         or (l.situacao = 'pendente' and o.data between ${mes.inicio} and ${mes.fim}))
       ${ver === 'entrou' ? sql`and l.situacao = 'quitado' and l.natureza = 'entrada'` : sql``}
       ${ver === 'saiu' ? sql`and l.situacao = 'quitado' and l.natureza = 'saida'` : sql``}
       ${ver === 'pendentes' ? sql`and l.situacao = 'pendente'` : sql``}
     order by quando desc, o.numero desc
  `
}
