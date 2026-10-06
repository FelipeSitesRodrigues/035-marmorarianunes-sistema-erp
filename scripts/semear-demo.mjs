/*
 * Dados de DEMONSTRAÇÃO pro banco local (npm run db -- --demo): pedras,
 * compras, vendas, saídas e despesas de setembro e outubro de 2026, todas
 * passando pelas funções do banco, como se a Val tivesse lançado.
 * Recusa rodar fora do localhost: nada disso pode ir pra produção.
 *
 * Login da demonstração: val@nunes.local / nunes-demo-2026
 */
import { randomBytes, randomUUID, scrypt } from 'node:crypto'
import postgres from 'postgres'

const PEDRAS = [
  ['Verde Ubatuba', 'Granito', 'chapa', 14, 5, 980, 'verde-ubatuba', 'Granitos do Vale'],
  ['Preto São Gabriel', 'Granito', 'chapa', 9, 5, 1150, 'preto-sao-gabriel', 'Granitos do Vale'],
  ['Itaúnas', 'Granito', 'chapa', 6, 6, 1080, 'itaunas', 'Pedras da Chapada'],
  ['Branco Siena', 'Granito', 'chapa', 12, 6, 790, 'branco-siena', 'Granitos do Vale'],
  ['Branco Dallas', 'Granito', 'chapa', 8, 4, 860, 'branco-dallas', 'Granitos do Vale'],
  ['Cinza Andorinha', 'Granito', 'm2', 42.5, 20, 145, 'cinza-andorinha', 'Granitos do Vale'],
  ['Café Imperial', 'Granito', 'chapa', 5, 2, 1240, 'cafe-imperial', 'Pedras da Chapada'],
  ['Amarelo Ornamental', 'Granito', 'chapa', 7, 3, 720, 'amarelo-ornamental', 'Pedras da Chapada'],
  ['Bege Bahia', 'Mármore', 'chapa', 3, 3, 1350, 'bege-bahia', 'Pedras da Chapada'],
  ['Mármore Branco', 'Mármore', 'chapa', 4, 2, 1890, 'marmore-branco', 'Pedras da Chapada'],
  ['Taj Mahal Escovado', 'Quartzito', 'chapa', 3, 1, 3400, 'taj-mahal-e', 'Pedras da Chapada'],
  ['Lâmina Sinterizada', 'Sinterizado', 'chapa', 9, 4, 2900, 'lamina-sinterizada', 'Pedras da Chapada'],
  ['Preto Via Láctea', 'Granito', 'chapa', 4, 2, 1600, 'preto-via-lactea', 'Granitos do Vale'],
  ['Exótico Gold', 'Granito', 'chapa', 2, 1, 2100, 'exotico-gold', 'Pedras da Chapada'],
  ['Disco de corte 350 mm', 'Insumo', 'unidade', 4, 10, 89, null, 'Casa do Marmorista'],
  ['Massa plástica', 'Insumo', 'litro', 12, 5, 38, null, 'Casa do Marmorista'],
  ['Cuba de inox', 'Insumo', 'unidade', 6, 3, 210, null, 'Casa do Marmorista'],
]

const hash = (senha) => {
  const sal = randomBytes(16)
  return new Promise((ok, erro) =>
    scrypt(senha, sal, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, c) =>
      e ? erro(e) : ok(`scrypt$16384$8$1$${sal.toString('base64')}$${c.toString('base64')}`),
    ),
  )
}

export async function semearDemo(url) {
  if (!/@localhost[:/]/.test(url)) throw new Error('A demonstração só roda no banco local.')
  const sql = postgres(url, { max: 1, onnotice: () => {} })
  try {
    const [{ n }] = await sql`select count(*)::int as n from nunes.operacoes`
    if (n > 0) {
      console.log('O banco local já tem lançamentos; a demonstração não foi semeada de novo.')
      return
    }
    let [val] = await sql`select id from nunes.usuarios where email = 'val@nunes.local'`
    if (!val) {
      ;[val] = await sql`insert into nunes.usuarios (nome, email, senha_hash)
                          values ('Val', 'val@nunes.local', ${await hash('nunes-demo-2026')}) returning id`
    }
    const U = val.id
    const chamar = async (funcao, p) =>
      (await sql`select ${sql(funcao)}(${sql.json({ chave: randomUUID(), ...p })}, ${U}) as r`)[0].r

    const id = {}
    for (const [nome, categoria, unidade, quantidade, minimo, custo, foto, fornecedor] of PEDRAS) {
      const r = await chamar('cadastrar_material', {
        nome, categoria, unidade, quantidade_inicial: quantidade, custo_unitario: custo,
        estoque_minimo: minimo, foto, fornecedor, data: '2026-09-01',
      })
      id[nome] = r.material_id
    }
    const it = (nome, quantidade, valor_unitario) => ({ material_id: id[nome], quantidade, valor_unitario })
    const pago = (forma) => ({ modo: 'tudo', forma })

    // Setembro
    await chamar('registrar_compra', { data: '2026-09-04', fornecedor: 'Granitos do Vale', itens: [it('Verde Ubatuba', 6, 980), it('Branco Dallas', 4, 860)], pagamento: pago('Boleto') })
    await chamar('registrar_venda', { data: '2026-09-08', cliente: 'Construtora Horizonte', servico: 'Soleiras e peitoris', itens: [it('Cinza Andorinha', 12.5)], valor_total: 14600, pagamento: { modo: 'parte', valor_pago: 7300, forma: 'Transferência', vencimento: '2026-10-30' } })
    await chamar('registrar_venda', { data: '2026-09-12', cliente: 'Paulo Sérgio', servico: 'Escada em granito', itens: [it('Preto São Gabriel', 2)], valor_total: 7500, pagamento: { modo: 'parte', valor_pago: 3750, forma: 'Pix', vencimento: '2026-10-04' } })
    await chamar('lancar_despesa', { data: '2026-09-15', categoria: 'Energia', descricao: 'Conta de energia de agosto', valor: 760, pagamento: pago('Pix') })
    await chamar('registrar_venda', { data: '2026-09-20', cliente: 'Lúcia Fernandes', servico: 'Bancada do banheiro', itens: [it('Branco Dallas', 1)], valor_total: 2300, pagamento: pago('Cartão') })
    await chamar('registrar_saida', { data: '2026-09-22', motivo: 'perda', referencia: 'Trincou no transporte', itens: [it('Itaúnas', 1)] })
    await chamar('lancar_despesa', { data: '2026-09-30', categoria: 'Salário', descricao: 'Salário do ajudante', valor: 1800, pagamento: pago('Pix') })

    // Outubro
    await chamar('lancar_despesa', { data: '2026-10-02', categoria: 'Salário', descricao: 'Salário do ajudante', valor: 1800, pagamento: pago('Pix') })
    await chamar('registrar_venda', { data: '2026-10-03', cliente: 'Rita Souza', servico: 'Piso da varanda', itens: [it('Cinza Andorinha', 4.5)], valor_total: 2150, pagamento: pago('Cartão') })
    await chamar('registrar_compra', { data: '2026-10-03', fornecedor: 'Pedras da Chapada', itens: [it('Lâmina Sinterizada', 1, 2900)], pagamento: { modo: 'depois', vencimento: '2026-10-20' } })
    await chamar('registrar_compra', { data: '2026-10-04', fornecedor: 'Granitos do Vale', itens: [it('Verde Ubatuba', 5, 1040)], pagamento: { modo: 'depois', vencimento: '2026-10-07' } })
    await chamar('registrar_venda', { data: '2026-10-04', cliente: 'Dra. Paula Menezes', servico: 'Cozinha completa', itens: [it('Verde Ubatuba', 3), it('Cuba de inox', 1)], valor_total: 11800, pagamento: pago('Pix') })
    await chamar('lancar_despesa', { data: '2026-10-05', categoria: 'Frete', descricao: 'Frete de Salvador para Irecê', valor: 650, pagamento: pago('Dinheiro') })
    await chamar('lancar_despesa', { data: '2026-10-05', categoria: 'Energia', descricao: 'Conta de energia de setembro', valor: 800, pagamento: { modo: 'depois', vencimento: '2026-10-25' } })
    await chamar('registrar_saida', { data: '2026-10-05', motivo: 'obra', referencia: 'Cozinha da Dra. Paula', itens: [it('Itaúnas', 2)] })
    await chamar('registrar_venda', { data: '2026-10-05', cliente: 'Marcos Andrade', servico: 'Bancada da cozinha', itens: [it('Verde Ubatuba', 2)], valor_total: 4200, pagamento: { modo: 'parte', valor_pago: 2100, forma: 'Pix', vencimento: '2026-11-15' } })
    await chamar('registrar_compra', { data: '2026-10-06', fornecedor: 'Granitos do Vale', itens: [it('Branco Siena', 10, 790)], pagamento: pago('Pix') })
    await chamar('registrar_venda', { data: '2026-10-06', cliente: 'Joana Ribeiro', servico: 'Pia do banheiro', itens: [it('Branco Siena', 1)], valor_total: 1650, pagamento: { modo: 'depois', vencimento: '2026-11-15' } })
    await chamar('registrar_saida', { data: '2026-10-06', motivo: 'obra', referencia: 'Escada do Sr. Marcos', itens: [it('Preto São Gabriel', 3)] })

    console.log('Demonstração semeada. Login: val@nunes.local / nunes-demo-2026')
  } finally {
    await sql.end()
  }
}
