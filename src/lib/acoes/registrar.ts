'use server'

import { sql } from '../db'
import type {
  DadosAjuste,
  DadosCompra,
  DadosDespesa,
  DadosMaterial,
  DadosSaida,
  DadosVenda,
  Resultado,
  ResultadoSimples,
  Resumo,
} from '../tipos'
import { data, executar, lista, numero, pagamento, texto, uuid } from './comum'

/*
 * Os seis registros dos botões de ação. Cada um vira uma chamada só ao banco,
 * numa transação: estoque e dinheiro mudam juntos ou não mudam.
 */

const itemQtd = (i: Record<string, unknown>) => ({ material_id: uuid(i.material_id), quantidade: numero(i.quantidade) })

async function chamar(funcao: string, dados: object, usuarioId: string) {
  const [linha] = await sql<{ r: Resumo }[]>`select ${sql(`nunes.${funcao}`)}(${sql.json(dados as never)}, ${usuarioId}::uuid) as r`
  return linha.r
}

function resultado(r: Awaited<ReturnType<typeof executar<Resumo>>>): Resultado {
  return r.ok ? { ok: true, resumo: r.valor } : r
}

export async function registrarVenda(d: DadosVenda): Promise<Resultado> {
  const limpo = {
    chave: uuid(d?.chave),
    data: data(d?.data),
    cliente: texto(d?.cliente, 80),
    servico: texto(d?.servico, 120),
    itens: lista(d?.itens, itemQtd),
    valor_total: numero(d?.valor_total),
    pagamento: pagamento(d?.pagamento),
    observacoes: texto(d?.observacoes, 500),
  }
  return resultado(await executar((u) => chamar('registrar_venda', limpo, u)))
}

export async function registrarCompra(d: DadosCompra): Promise<Resultado> {
  const limpo = {
    chave: uuid(d?.chave),
    data: data(d?.data),
    fornecedor: texto(d?.fornecedor, 80),
    itens: lista(d?.itens, (i) => ({ ...itemQtd(i), valor_unitario: numero(i.valor_unitario) })),
    pagamento: pagamento(d?.pagamento),
    observacoes: texto(d?.observacoes, 500),
  }
  return resultado(await executar((u) => chamar('registrar_compra', limpo, u)))
}

export async function registrarSaida(d: DadosSaida): Promise<Resultado> {
  const limpo = {
    chave: uuid(d?.chave),
    data: data(d?.data),
    motivo: texto(d?.motivo, 20),
    referencia: texto(d?.referencia, 120),
    itens: lista(d?.itens, itemQtd),
    observacoes: texto(d?.observacoes, 500),
  }
  return resultado(await executar((u) => chamar('registrar_saida', limpo, u)))
}

export async function lancarDespesa(d: DadosDespesa): Promise<Resultado> {
  const limpo = {
    chave: uuid(d?.chave),
    data: data(d?.data),
    categoria: texto(d?.categoria, 40),
    descricao: texto(d?.descricao, 120),
    contraparte: texto(d?.contraparte, 80),
    valor: numero(d?.valor),
    pagamento: pagamento(d?.pagamento),
    observacoes: texto(d?.observacoes, 500),
  }
  return resultado(await executar((u) => chamar('lancar_despesa', limpo, u)))
}

function limparMaterial(d: DadosMaterial) {
  return {
    chave: uuid(d?.chave),
    nome: texto(d?.nome, 80),
    categoria: texto(d?.categoria, 20),
    unidade: texto(d?.unidade, 10),
    quantidade_inicial: numero(d?.quantidade_inicial),
    custo_unitario: numero(d?.custo_unitario),
    estoque_minimo: numero(d?.estoque_minimo),
    fornecedor: texto(d?.fornecedor, 80),
    observacoes: texto(d?.observacoes, 500),
    foto: texto(d?.foto, 60),
    data: data(d?.data),
  }
}

export async function cadastrarMaterial(d: DadosMaterial): Promise<Resultado> {
  const limpo = limparMaterial(d)
  return resultado(
    await executar(async (u) => {
      const [linha] = await sql<{ r: Resumo }[]>`select nunes.cadastrar_material(${sql.json(limpo as never)}, ${u}::uuid) as r`
      return linha.r
    }),
  )
}

export async function editarMaterial(id: string, d: DadosMaterial): Promise<ResultadoSimples> {
  const limpo = limparMaterial(d)
  const materialId = uuid(id)
  const r = await executar(async (u) => {
    await sql`select nunes.editar_material(${materialId ?? null}::uuid, ${sql.json(limpo as never)}, ${u}::uuid)`
  })
  return r.ok ? { ok: true } : r
}

export async function arquivarMaterial(id: string): Promise<ResultadoSimples> {
  const r = await executar(async (u) => {
    await sql`select nunes.arquivar_material(${uuid(id) ?? null}::uuid, ${u}::uuid)`
  })
  return r.ok ? { ok: true } : r
}

export async function ajustarEstoque(d: DadosAjuste): Promise<Resultado> {
  const limpo = {
    chave: uuid(d?.chave),
    data: data(d?.data),
    material_id: uuid(d?.material_id),
    quantidade_contada: numero(d?.quantidade_contada),
    motivo: texto(d?.motivo, 120),
    observacoes: texto(d?.observacoes, 500),
  }
  return resultado(await executar((u) => chamar('ajustar_estoque', limpo, u)))
}
