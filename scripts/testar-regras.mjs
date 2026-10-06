/*
 * Testes das regras de estoque e dinheiro, direto nas funções do banco.
 * Recria o banco "nunes_teste" a cada rodada e conecta como nunes_app, o
 * mesmo usuário do sistema (então as permissões também são testadas).
 *
 *   npm run testar     (o Postgres local sobe sozinho se não estiver rodando)
 */
import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { subirBanco, prepararBanco, PORTA } from './db-local.mjs'

let pg = null
try {
  const teste = postgres(`postgres://postgres:postgres@localhost:${PORTA}/postgres`, { max: 1, connect_timeout: 2 })
  await teste`select 1`
  await teste.end()
} catch {
  pg = await subirBanco()
}
await prepararBanco('nunes_teste', { recriar: true })

const sql = postgres(`postgres://nunes_app:nunes-local@localhost:${PORTA}/nunes_teste`, {
  max: 1,
  onnotice: () => {},
  types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
})

let falhas = 0
let total = 0
function confere(nome, obtido, esperado) {
  total++
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado)
  if (!ok) falhas++
  console.log(`${ok ? '  ok ' : 'FALHA'} ${nome}${ok ? '' : `\n        esperado ${JSON.stringify(esperado)}\n        obtido   ${JSON.stringify(obtido)}`}`)
}
async function erroDe(promessa) {
  try {
    await promessa
    return null
  } catch (e) {
    return e.message
  }
}

const [val] = await sql`insert into usuarios (nome, email, senha_hash) values ('Val', 'val@teste.local', 'x') returning id`
const U = val.id
const chamar = (funcao, p) => sql`select ${sql(funcao)}(${sql.json(p)}, ${U}) as r`.then((l) => l[0].r)
const material = async (id) => (await sql`select quantidade, custo_medio from materiais where id = ${id}`)[0]
const lancs = async (op) =>
  (await sql`select natureza, valor, situacao from lancamentos where operacao_id = ${op} order by situacao, valor`).map(
    (l) => `${l.natureza} ${l.valor} ${l.situacao}`,
  )

console.log('\nCadastro e saída (exemplo do escopo: 20 chapas, usa 3, ficam 17)')
const cad = await chamar('cadastrar_material', {
  chave: randomUUID(), nome: 'Branco Siena', categoria: 'Granito', unidade: 'chapa',
  quantidade_inicial: 20, custo_unitario: 790, estoque_minimo: 6, data: '2026-10-01',
})
const siena = cad.material_id
confere('estoque inicial', await material(siena), { quantidade: 20, custo_medio: 790 })
confere('cadastro não mexe no dinheiro', await lancs(cad.id), [])
const usoObra = await chamar('registrar_saida', {
  chave: randomUUID(), motivo: 'obra', referencia: 'Escada Sr. Marcos', data: '2026-10-02',
  itens: [{ material_id: siena, quantidade: 3 }],
})
confere('20 - 3 = 17', (await material(siena)).quantidade, 17)
confere('uso em obra não é despesa', await lancs(usoObra.id), [])
confere(
  'não deixa tirar mais que o estoque',
  await erroDe(chamar('registrar_saida', { chave: randomUUID(), motivo: 'perda', itens: [{ material_id: siena, quantidade: 18 }] })),
  'Só tem 17 chapas de Branco Siena no estoque. Confira a quantidade.',
)
confere('estoque intacto depois do erro', (await material(siena)).quantidade, 17)

console.log('\nCompra e custo médio')
const chaveCompra = randomUUID()
const compra = await chamar('registrar_compra', {
  chave: chaveCompra, fornecedor: 'Granitos do Vale', data: '2026-10-06',
  itens: [{ material_id: siena, quantidade: 10, valor_unitario: 1000 }],
  pagamento: { modo: 'tudo', forma: 'Pix' },
})
confere('17 + 10 = 27', (await material(siena)).quantidade, 27)
confere('custo médio (17x790 + 10x1000) / 27', (await material(siena)).custo_medio, 867.7778)
confere('compra paga sai do caixa', await lancs(compra.id), ['saida 10000 quitado'])
const repetida = await chamar('registrar_compra', {
  chave: chaveCompra, fornecedor: 'Granitos do Vale',
  itens: [{ material_id: siena, quantidade: 10, valor_unitario: 1000 }], pagamento: { modo: 'tudo', forma: 'Pix' },
})
confere('clique duplo não duplica a compra', [repetida.id, (await material(siena)).quantidade], [compra.id, 27])
confere(
  'pagamento sem forma é barrado',
  await erroDe(chamar('registrar_compra', { chave: randomUUID(), itens: [{ material_id: siena, quantidade: 1, valor_unitario: 5 }], pagamento: { modo: 'tudo' } })),
  'Diga como foi pago: Pix, dinheiro, cartão...',
)
confere('compra barrada não mexe no estoque', (await material(siena)).quantidade, 27)

console.log('\nVenda com sinal e resto a receber')
const venda = await chamar('registrar_venda', {
  chave: randomUUID(), cliente: 'Marcos Andrade', servico: 'Bancada da cozinha', data: '2026-10-06',
  itens: [{ material_id: siena, quantidade: 2 }], valor_total: 4200,
  pagamento: { modo: 'parte', valor_pago: 2100, forma: 'Pix', vencimento: '2026-11-15' },
})
confere('27 - 2 = 25', (await material(siena)).quantidade, 25)
confere('metade recebida, metade a receber', await lancs(venda.id), ['entrada 2100 pendente', 'entrada 2100 quitado'])
confere('resumo devolve o que ficou a receber', [venda.quitado, venda.pendente, venda.vencimento], [2100, 2100, '2026-11-15'])
confere(
  'parte maior que o total é barrada',
  await erroDe(chamar('registrar_venda', { chave: randomUUID(), cliente: 'X', valor_total: 100, pagamento: { modo: 'parte', valor_pago: 150, forma: 'Pix', vencimento: '2026-11-01' } })),
  'O valor recebido agora precisa ser maior que zero e menor que o total de R$ 100,00.',
)
const [pend] = await sql`select id from lancamentos where operacao_id = ${venda.id} and situacao = 'pendente'`
await sql`select quitar_lancamento(${pend.id}, 1000, '2026-10-20', 'Dinheiro', ${U})`
confere('recebeu R$ 1.000 dos 2.100', await lancs(venda.id), ['entrada 1100 pendente', 'entrada 1000 quitado', 'entrada 2100 quitado'])

console.log('\nCorreção guarda o original')
const corrigida = (
  await sql.unsafe('select corrigir_operacao($1, $2, $3, $4) as r', [
    venda.id,
    sql.json({ chave: randomUUID(), cliente: 'Marcos Andrade', servico: 'Bancada e ilha', data: '2026-10-06', itens: [{ material_id: siena, quantidade: 3 }], valor_total: 5000 }),
    'Eram 3 chapas, não 2',
    U,
  ])
)[0].r
confere('estoque refeito: 25 + 2 - 3 = 24', (await material(siena)).quantidade, 24)
confere('o que já entrou continua; falta 5000 - 3100', await lancs(corrigida.id), ['entrada 1900 pendente', 'entrada 1000 quitado', 'entrada 2100 quitado'])
confere('original ficou como corrigida', (await sql`select situacao, substituida_por from operacoes where id = ${venda.id}`)[0], { situacao: 'corrigida', substituida_por: corrigida.id })
confere('original não conta mais dinheiro', await lancs(venda.id), ['entrada 1100 cancelado'])
confere(
  'novo total menor que o já recebido é barrado',
  await erroDe(sql.unsafe('select corrigir_operacao($1, $2, $3, $4)', [corrigida.id, sql.json({ chave: randomUUID(), cliente: 'Marcos', valor_total: 2000, itens: [] }), '', U])),
  'Já foi recebido R$ 3.100,00 nesse lançamento, mais que o novo total de R$ 2.000,00.',
)
confere('correção barrada não mexe no estoque', (await material(siena)).quantidade, 24)

console.log('\nCorreção de compra desfaz o custo médio')
const cad2 = await chamar('cadastrar_material', { chave: randomUUID(), nome: 'Verde Ubatuba', categoria: 'Granito', unidade: 'chapa', quantidade_inicial: 10, custo_unitario: 100 })
const verde = cad2.material_id
const compraErrada = await chamar('registrar_compra', { chave: randomUUID(), itens: [{ material_id: verde, quantidade: 5, valor_unitario: 1000 }], pagamento: { modo: 'depois', vencimento: '2026-10-30' } })
confere('média com o preço errado', (await material(verde)).custo_medio, 400)
await sql.unsafe('select corrigir_operacao($1, $2, $3, $4)', [compraErrada.id, sql.json({ chave: randomUUID(), itens: [{ material_id: verde, quantidade: 5, valor_unitario: 200 }] }), 'preço', U])
confere('média certa: (10x100 + 5x200) / 15', [(await material(verde)).quantidade, (await material(verde)).custo_medio], [15, 133.3333])
const [aPagar] = await sql`select l.valor, l.vencimento::text as venc from lancamentos l join operacoes o on o.id = l.operacao_id where o.substitui_id = ${compraErrada.id} and l.situacao = 'pendente'`
confere('conta a pagar recalculada, mesmo vencimento', aPagar, { valor: 1000, venc: '2026-10-30' })

console.log('\nCancelar')
await chamar('registrar_saida', { chave: randomUUID(), motivo: 'obra', itens: [{ material_id: verde, quantidade: 14 }] })
const [{ id: compraAtiva }] = await sql`select id from operacoes where substitui_id = ${compraErrada.id}`
confere(
  'não cancela compra cuja pedra já saiu',
  await erroDe(sql`select cancelar_operacao(${compraAtiva}, 'teste', ${U})`),
  'Não dá pra desfazer: parte de Verde Ubatuba já saiu do estoque. Hoje tem 1 chapa.',
)
await sql`select cancelar_operacao(${corrigida.id}, 'cliente desistiu', ${U})`
confere('venda cancelada devolve as 3 chapas', (await material(siena)).quantidade, 27)
confere('e o dinheiro dela some do caixa', await lancs(corrigida.id), ['entrada 1000 cancelado', 'entrada 1900 cancelado', 'entrada 2100 cancelado'])
confere('cancelar de novo é barrado', await erroDe(sql`select cancelar_operacao(${corrigida.id}, '', ${U})`), 'Esse lançamento já foi cancelado antes.')

console.log('\nDespesa, ajuste e venda só de serviço')
const desp = await chamar('lancar_despesa', { chave: randomUUID(), categoria: 'Frete', descricao: 'Frete de Salvador', valor: 650, pagamento: { modo: 'depois', vencimento: '2026-10-25' } })
confere('despesa pra depois fica a pagar', await lancs(desp.id), ['saida 650 pendente'])
const servico = await chamar('registrar_venda', { chave: randomUUID(), cliente: 'Rita Souza', servico: 'Polimento', valor_total: 300, itens: [], pagamento: { modo: 'tudo', forma: 'Dinheiro' } })
confere('venda de serviço entra no caixa sem mexer em pedra', [await lancs(servico.id), servico.materiais], [['entrada 300 quitado'], []])
await chamar('ajustar_estoque', { chave: randomUUID(), material_id: siena, quantidade_contada: 24.5, motivo: 'Contagem do pátio' })
confere('ajuste para a contagem', (await material(siena)).quantidade, 24.5)
confere('m² e frações no texto', (await sql`select fmt_qtd(42.5, 'm2') as a, fmt_qtd(1, 'chapa') as b, fmt_qtd(2, 'chapa') as c`)[0], { a: '42,5 m²', b: '1 chapa', c: '2 chapas' })

console.log('\nHistórico não se apaga')
confere('apagar movimento é barrado', await erroDe(sql`delete from movimentos`), 'permission denied for table movimentos')
confere('reescrever movimento é barrado', await erroDe(sql`update movimentos set quantidade = 1`), 'O histórico não pode ser apagado nem reescrito.')
confere('apagar operação é barrado', await erroDe(sql`delete from operacoes`), 'permission denied for table operacoes')
confere('estoque nunca negativo nem mexendo na mão', await erroDe(sql`update materiais set quantidade = -1 where id = ${siena}`), 'new row for relation "materiais" violates check constraint "materiais_quantidade_check"')
confere('o sistema não enxerga outro schema', await erroDe(sql`create table public.invasao (id int)`), 'permission denied for schema public')

console.log(`\n${total - falhas} de ${total} ok${falhas ? `, ${falhas} FALHAS` : ''}`)
await sql.end()
if (pg) await pg.stop()
process.exit(falhas ? 1 : 0)
