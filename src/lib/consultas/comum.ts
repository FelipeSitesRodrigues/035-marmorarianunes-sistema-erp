import 'server-only'
import { sql } from '../db'
import type { Contatos, MaterialOpcao, OperacaoLinha } from '../tipos'

/** Materiais ativos, pro seletor dos formulários e pra lista do estoque. */
export async function materiaisAtivos() {
  return sql<MaterialOpcao[]>`
    select id, nome, categoria, unidade, quantidade, estoque_minimo, custo_medio, fornecedor, observacoes, foto
      from nunes.materiais
     where ativo
     order by nome
  `
}

/** Nomes já usados, pra sugerir enquanto a Val digita (sem cadastro de cliente). */
export async function contatosConhecidos(): Promise<Contatos> {
  const linhas = await sql<{ grupo: keyof Contatos; nome: string }[]>`
    select grupo, nome from (
      select case tipo when 'venda' then 'clientes' when 'despesa' then 'pagos' else 'fornecedores' end as grupo,
             contraparte as nome, max(criado_em) as ultima
        from nunes.operacoes
       where contraparte is not null and situacao <> 'cancelada'
       group by 1, 2
      union all
      select 'obras', referencia, max(criado_em)
        from nunes.operacoes
       where referencia is not null and tipo = 'saida' and situacao <> 'cancelada'
       group by 1, 2
    ) x
    order by ultima desc
    limit 400
  `
  const contatos: Contatos = { clientes: [], fornecedores: [], obras: [], pagos: [] }
  for (const l of linhas) contatos[l.grupo].push(l.nome)
  return contatos
}

const COLUNAS_OPERACAO = sql`
  id, numero, tipo, data, criado_em, contraparte, referencia, motivo, categoria, descricao, valor_total,
  observacoes, situacao, substitui_id, substituida_por, itens, quitado, pendente, vencimento, forma, criado_por_nome
`

export async function ultimasOperacoes(limite: number) {
  return sql<OperacaoLinha[]>`
    select ${COLUNAS_OPERACAO}
      from nunes.v_operacoes
     where situacao = 'ativa'
     order by criado_em desc
     limit ${limite}
  `
}

export type FiltroHistorico = {
  busca?: string
  tipo?: string
  de?: string
  ate?: string
  materialId?: string
  pagina: number
}

export const POR_PAGINA = 40

export async function operacoesFiltradas(f: FiltroHistorico) {
  const termo = f.busca?.trim() ? `%${f.busca.trim()}%` : null
  const tipos: Record<string, string[]> = {
    vendas: ['venda'],
    compras: ['compra'],
    saidas: ['saida'],
    despesas: ['despesa'],
    estoque: ['cadastro', 'ajuste'],
  }
  const filtroTipo = f.tipo && tipos[f.tipo] ? tipos[f.tipo] : null
  const linhas = await sql<OperacaoLinha[]>`
    select ${COLUNAS_OPERACAO}
      from nunes.v_operacoes
     where true
       ${filtroTipo ? sql`and tipo in ${sql(filtroTipo)}` : sql``}
       ${f.de ? sql`and data >= ${f.de}` : sql``}
       ${f.ate ? sql`and data <= ${f.ate}` : sql``}
       ${f.materialId ? sql`and itens @> ${sql.json([{ material_id: f.materialId }])}` : sql``}
       ${
         termo
           ? sql`and (contraparte ilike ${termo} or referencia ilike ${termo} or descricao ilike ${termo}
                      or observacoes ilike ${termo} or categoria ilike ${termo}
                      or exists (select 1 from jsonb_array_elements(itens) i where i ->> 'nome' ilike ${termo})
                      or numero::text = ${f.busca!.trim().replace(/^#/, '')})`
           : sql``
       }
     order by data desc, numero desc
     limit ${POR_PAGINA + 1} offset ${(f.pagina - 1) * POR_PAGINA}
  `
  return { linhas: linhas.slice(0, POR_PAGINA), temMais: linhas.length > POR_PAGINA }
}
