/*
 * Os cinco botões de ação: mesma ordem e mesmas palavras em todo lugar.
 * Os ícones ficam em quem desenha (servidor usa o pacote /ssr do Phosphor,
 * o navegador o pacote normal): Tag, ShoppingCart, ArrowsLeftRight, Receipt, Cube.
 */
export const ACOES = [
  { tipo: 'venda', titulo: 'Registrar venda', explicacao: 'Vendeu pedra ou peça pra um cliente' },
  { tipo: 'compra', titulo: 'Registrar compra', explicacao: 'Chegou pedra ou material do fornecedor' },
  { tipo: 'saida', titulo: 'Registrar saída', explicacao: 'Usou numa obra, quebrou ou descartou' },
  { tipo: 'despesa', titulo: 'Lançar despesa', explicacao: 'Frete, luz, salário e outras contas' },
  { tipo: 'material', titulo: 'Cadastrar material', explicacao: 'Pedra ou material novo no estoque' },
] as const

export type TipoRegistro = (typeof ACOES)[number]['tipo'] | 'ajuste' | 'editar'
