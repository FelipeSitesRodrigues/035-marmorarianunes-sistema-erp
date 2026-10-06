'use server'

import { sql } from '../db'
import type {
  DadosCompra,
  DadosDespesa,
  DadosSaida,
  DadosVenda,
  OperacaoParaCorrigir,
  Resultado,
  ResultadoSimples,
  Resumo,
} from '../tipos'
import { data, executar, lista, numero, pagamento, texto, uuid } from './comum'
import { exigirUsuario } from '../sessao'

/* Recebi, Paguei, nova data, corrigir e cancelar. */

export async function quitar(id: string, valor: number | null, quando: string, forma: string): Promise<ResultadoSimples> {
  const r = await executar(async (u) => {
    await sql`select nunes.quitar_lancamento(${uuid(id) ?? null}::uuid, ${numero(valor) ?? null}::numeric,
                                             ${data(quando) ?? null}::date, ${texto(forma, 40) ?? null}, ${u}::uuid)`
  })
  return r.ok ? { ok: true } : r
}

export async function reabrir(id: string): Promise<ResultadoSimples> {
  const r = await executar(async (u) => {
    await sql`select nunes.reabrir_lancamento(${uuid(id) ?? null}::uuid, ${u}::uuid)`
  })
  return r.ok ? { ok: true } : r
}

export async function mudarVencimento(id: string, quando: string): Promise<ResultadoSimples> {
  const r = await executar(async (u) => {
    await sql`select nunes.mudar_vencimento(${uuid(id) ?? null}::uuid, ${data(quando) ?? null}::date, ${u}::uuid)`
  })
  return r.ok ? { ok: true } : r
}

export async function cancelar(id: string, motivo: string): Promise<ResultadoSimples> {
  const r = await executar(async (u) => {
    await sql`select nunes.cancelar_operacao(${uuid(id) ?? null}::uuid, ${texto(motivo, 200) ?? null}, ${u}::uuid)`
  })
  return r.ok ? { ok: true } : r
}

type DadosCorrecao = DadosVenda | DadosCompra | DadosSaida | DadosDespesa

export async function corrigir(id: string, d: DadosCorrecao, motivo: string): Promise<Resultado> {
  const bruto = (d ?? {}) as Record<string, unknown>
  const limpo = {
    chave: uuid(bruto.chave),
    data: data(bruto.data),
    cliente: texto(bruto.cliente, 80),
    servico: texto(bruto.servico, 120),
    fornecedor: texto(bruto.fornecedor, 80),
    motivo: texto(bruto.motivo, 20),
    referencia: texto(bruto.referencia, 120),
    categoria: texto(bruto.categoria, 40),
    descricao: texto(bruto.descricao, 120),
    contraparte: texto(bruto.contraparte, 80),
    valor: numero(bruto.valor),
    valor_total: numero(bruto.valor_total),
    itens: lista(bruto.itens, (i) => ({
      material_id: uuid(i.material_id),
      quantidade: numero(i.quantidade),
      valor_unitario: numero(i.valor_unitario),
    })),
    pagamento: pagamento(bruto.pagamento),
    observacoes: texto(bruto.observacoes, 500),
  }
  const r = await executar(async (u) => {
    const [linha] = await sql<{ r: Resumo }[]>`
      select nunes.corrigir_operacao(${uuid(id) ?? null}::uuid, ${sql.json(limpo as never)}, ${texto(motivo, 200) ?? null}, ${u}::uuid) as r
    `
    return linha.r
  })
  return r.ok ? { ok: true, resumo: r.valor } : r
}

/** Campos da operação de volta, pra abrir o formulário de correção já preenchido. */
export async function carregarParaCorrigir(id: string): Promise<OperacaoParaCorrigir | null> {
  await exigirUsuario()
  const opId = uuid(id)
  if (!opId) return null
  const [op] = await sql<OperacaoParaCorrigir[]>`
    select o.id, o.numero, o.tipo, o.data, o.contraparte, o.referencia, o.motivo, o.categoria, o.descricao,
           o.valor_total, o.observacoes, v.quitado, v.pendente, v.vencimento,
           coalesce((select jsonb_agg(jsonb_build_object('material_id', m.material_id, 'quantidade', m.quantidade,
                                                         'valor_unitario', m.custo_unitario) order by m.id)
                       from nunes.movimentos m where m.operacao_id = o.id and not m.estorno), '[]') as itens
      from nunes.operacoes o
      join nunes.v_operacoes v on v.id = o.id
     where o.id = ${opId} and o.situacao = 'ativa' and o.tipo in ('compra', 'venda', 'saida', 'despesa')
  `
  return op ?? null
}
