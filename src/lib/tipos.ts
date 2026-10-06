import type { Categoria, Unidade } from './formatos'

/* Tipos que passam entre o servidor e a tela. */

export type MaterialOpcao = {
  id: string
  nome: string
  categoria: Categoria
  unidade: Unidade
  quantidade: number
  estoque_minimo: number
  custo_medio: number
  fornecedor: string | null
  observacoes: string | null
  foto: string | null
}

export type Contatos = {
  clientes: string[]
  fornecedores: string[]
  obras: string[]
  pagos: string[]
}

export type ItemQtd = { material_id: string; quantidade: number }
export type ItemCompra = ItemQtd & { valor_unitario: number }

export type ModoPagamento = 'tudo' | 'parte' | 'depois'
export type Pagamento = { modo: ModoPagamento; valor_pago?: number; forma?: string; vencimento?: string }

export type DadosVenda = {
  chave: string
  data: string
  cliente: string
  servico?: string
  itens: ItemQtd[]
  valor_total: number
  pagamento: Pagamento
  observacoes?: string
}

export type DadosCompra = {
  chave: string
  data: string
  fornecedor?: string
  itens: ItemCompra[]
  pagamento: Pagamento
  observacoes?: string
}

export type MotivoSaida = 'obra' | 'perda' | 'descarte' | 'outro'

export type DadosSaida = {
  chave: string
  data: string
  motivo: MotivoSaida
  referencia?: string
  itens: ItemQtd[]
  observacoes?: string
}

export type DadosDespesa = {
  chave: string
  data: string
  categoria: string
  descricao: string
  contraparte?: string
  valor: number
  pagamento: Pagamento
  observacoes?: string
}

export type DadosMaterial = {
  chave: string
  nome: string
  categoria: Categoria
  unidade: Unidade
  quantidade_inicial?: number
  custo_unitario?: number
  estoque_minimo: number
  fornecedor?: string
  observacoes?: string
  foto?: string
  data?: string
}

export type DadosAjuste = {
  chave: string
  data: string
  material_id: string
  quantidade_contada: number
  motivo: string
  observacoes?: string
}

export type TipoOperacao = 'cadastro' | 'compra' | 'venda' | 'saida' | 'despesa' | 'ajuste'

export type Resumo = {
  id: string
  numero: number
  tipo: TipoOperacao
  situacao: 'ativa' | 'corrigida' | 'cancelada'
  valor_total: number
  contraparte: string | null
  materiais: { id: string; nome: string; unidade: Unidade; quantidade: number; estoque_minimo: number; movido: number }[]
  quitado: number
  pendente: number
  vencimento: string | null
  material_id?: string
}

export type Resultado = { ok: true; resumo: Resumo } | { ok: false; erro: string }
export type ResultadoSimples = { ok: true } | { ok: false; erro: string }

/** Linha de operação como aparece em listas (Início, Histórico) */
export type OperacaoLinha = {
  id: string
  numero: number
  tipo: TipoOperacao
  data: string
  criado_em: string
  contraparte: string | null
  referencia: string | null
  motivo: string | null
  categoria: string | null
  descricao: string | null
  valor_total: number
  observacoes: string | null
  situacao: 'ativa' | 'corrigida' | 'cancelada'
  substitui_id: string | null
  substituida_por: string | null
  itens: { material_id: string; nome: string; unidade: Unidade; foto: string | null; quantidade: number; sentido: 1 | -1 }[]
  quitado: number
  pendente: number
  vencimento: string | null
  forma: string | null
  criado_por_nome: string | null
}

/** Operação carregada pra corrigir: os campos do formulário de volta */
export type OperacaoParaCorrigir = {
  id: string
  numero: number
  tipo: 'compra' | 'venda' | 'saida' | 'despesa'
  data: string
  contraparte: string | null
  referencia: string | null
  motivo: string | null
  categoria: string | null
  descricao: string | null
  valor_total: number
  observacoes: string | null
  itens: { material_id: string; quantidade: number; valor_unitario: number }[]
  quitado: number
  pendente: number
  vencimento: string | null
}
