import Link from 'next/link'
import { Info, Plus } from '@phosphor-icons/react/dist/ssr'
import { textoItens } from '@/components/listas/descrever'
import { SeletorMes } from '@/components/listas/SeletorMes'
import { resumoDoMes } from '@/lib/consultas/inicio'
import { contasAbertas, dinheiroDoMes, type ContaAberta as Conta, type MovimentoDinheiro } from '@/lib/consultas/financeiro'
import { dataCurta, reais } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import { hojeISO, mesDe } from '@/lib/tempo'
import { ContaAberta } from './ContaAberta'
import s from './financeiro.module.css'

export const metadata = { title: 'Financeiro' }

/** O que foi a conta, em uma linha: "Bancada da cozinha" / "Compra de Verde Ubatuba, 5 chapas" */
function oQue(c: Pick<Conta, 'tipo' | 'referencia' | 'descricao' | 'itens'>) {
  if (c.tipo === 'despesa') return c.descricao ?? 'Despesa'
  const itens = textoItens({ itens: c.itens, tipo: c.tipo })
  if (c.tipo === 'compra') return itens ? `Compra de ${itens}` : 'Compra'
  return c.referencia ?? (itens || 'Venda')
}

function tipoDoDinheiro(m: MovimentoDinheiro) {
  if (m.situacao === 'quitado' && m.quando !== m.data_operacao) return m.natureza === 'entrada' ? 'Recebimento' : 'Pagamento'
  return { venda: 'Venda', compra: 'Compra', despesa: 'Despesa' }[m.tipo as 'venda'] ?? 'Lançamento'
}

export default async function Financeiro({ searchParams }: PageProps<'/financeiro'>) {
  await exigirUsuario()
  const params = await searchParams
  const mes = mesDe(params.mes)
  const ver = typeof params.ver === 'string' && ['entrou', 'saiu', 'pendentes'].includes(params.ver) ? params.ver : undefined
  const hoje = hojeISO()

  const [resumo, abertas, movimentos] = await Promise.all([resumoDoMes(mes), contasAbertas(), dinheiroDoMes(mes, ver)])
  const receber = abertas.filter((c) => c.natureza === 'entrada')
  const pagar = abertas.filter((c) => c.natureza === 'saida')
  const soma = (l: Conta[]) => l.reduce((t, c) => t + c.valor, 0)
  const saldo = resumo.entrou - resumo.saiu

  const base = { ...(mes.atual ? {} : { mes: mes.chave }) }
  const linkVer = (v?: string) => {
    const p = new URLSearchParams({ ...base, ...(v ? { ver: v } : {}) })
    return `/financeiro${p.toString() ? `?${p}` : ''}#dinheiro`
  }
  const linkDespesa = `/financeiro?${new URLSearchParams({ ...base, ...(ver ? { ver } : {}), registrar: 'despesa' })}`

  return (
    <div className={s.pagina}>
      <header className={s.topo}>
        <div>
          <h1>Financeiro</h1>
          <p className={s.ajuda}>
            <Info aria-hidden />
            Aqui só entra dinheiro. Pedra usada numa obra muda o estoque, não o caixa.
          </p>
        </div>
        <div className={s.topoAcoes}>
          <SeletorMes mes={mes} caminho="/financeiro" extra={ver ? { ver } : {}} />
          <Link href={linkDespesa} className="botao botao-principal" scroll={false}>
            <Plus weight="bold" aria-hidden />
            Lançar despesa
          </Link>
        </div>
      </header>

      <dl className={s.cartoes}>
        <div className="cartao">
          <dt>Entrou em {mes.nome}</dt>
          <dd className={s.verde}>{reais(resumo.entrou)}</dd>
        </div>
        <div className="cartao">
          <dt>Saiu em {mes.nome}</dt>
          <dd>{reais(resumo.saiu)}</dd>
        </div>
        <div className={`cartao ${s.saldo}`}>
          <dt>Saldo do mês</dt>
          <dd data-negativo={saldo < 0 || undefined}>{reais(saldo)}</dd>
        </div>
        <div className="cartao">
          <dt>Vendido no mês</dt>
          <dd>{reais(resumo.vendido)}</dd>
          <dd className={s.detalhe}>
            {resumo.vendas} {resumo.vendas === 1 ? 'venda' : 'vendas'}
          </dd>
        </div>
      </dl>

      <div className={s.contas}>
        <section className="cartao" id="receber" aria-labelledby="receber-titulo">
          <header className={s.contasTopo}>
            <h2 id="receber-titulo">A receber</h2>
            <strong>{reais(soma(receber))}</strong>
          </header>
          {receber.length ? (
            <ul className={s.lista}>
              {receber.map((c) => (
                <ContaAberta
                  key={c.id}
                  id={c.id}
                  natureza="entrada"
                  valor={c.valor}
                  vencimento={c.vencimento}
                  quem={c.contraparte ?? 'Cliente'}
                  oque={oQue(c)}
                  numero={c.numero}
                  hoje={hoje}
                />
              ))}
            </ul>
          ) : (
            <p className={s.vazio}>Ninguém deve nada à loja agora.</p>
          )}
        </section>

        <section className="cartao" id="pagar" aria-labelledby="pagar-titulo">
          <header className={s.contasTopo}>
            <h2 id="pagar-titulo">A pagar</h2>
            <strong>{reais(soma(pagar))}</strong>
          </header>
          {pagar.length ? (
            <ul className={s.lista}>
              {pagar.map((c) => (
                <ContaAberta
                  key={c.id}
                  id={c.id}
                  natureza="saida"
                  valor={c.valor}
                  vencimento={c.vencimento}
                  quem={c.contraparte ?? (c.tipo === 'despesa' ? (c.descricao ?? 'Despesa') : 'Fornecedor')}
                  oque={c.tipo === 'despesa' && !c.contraparte ? `Despesa: ${(c.categoria ?? 'outras').toLowerCase()}` : oQue(c)}
                  numero={c.numero}
                  hoje={hoje}
                />
              ))}
            </ul>
          ) : (
            <p className={s.vazio}>Nenhuma conta em aberto.</p>
          )}
        </section>
      </div>

      <section className={`cartao ${s.dinheiro}`} id="dinheiro" aria-labelledby="dinheiro-titulo">
        <header className={s.dinheiroTopo}>
          <h2 id="dinheiro-titulo">Movimentações do dinheiro em {mes.nome}</h2>
          <nav className={s.filtros} aria-label="Filtrar">
            <Link href={linkVer()} aria-current={!ver ? 'true' : undefined} scroll={false}>
              Tudo
            </Link>
            <Link href={linkVer('entrou')} aria-current={ver === 'entrou' ? 'true' : undefined} scroll={false}>
              Entrou
            </Link>
            <Link href={linkVer('saiu')} aria-current={ver === 'saiu' ? 'true' : undefined} scroll={false}>
              Saiu
            </Link>
            <Link href={linkVer('pendentes')} aria-current={ver === 'pendentes' ? 'true' : undefined} scroll={false}>
              Em aberto
            </Link>
          </nav>
        </header>
        {movimentos.length ? (
          <table className={s.tabela}>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">O que foi</th>
                <th scope="col">Tipo</th>
                <th scope="col">Forma</th>
                <th scope="col" className={s.direita}>
                  Valor
                </th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((m) => {
                const entrada = m.natureza === 'entrada'
                const quem = m.contraparte ? (m.tipo === 'venda' ? ` de ${m.contraparte}` : `, ${m.contraparte}`) : ''
                return (
                  <tr key={m.id}>
                    <td className={s.data}>{dataCurta(m.quando)}</td>
                    <td>
                      <Link href={`/historico/${m.numero}`} className={s.oque}>
                        {oQue(m)}
                        {quem}
                      </Link>
                      {m.corrigido && (
                        <Link href={`/historico/${m.numero}`} className={`etiqueta etiqueta-cinza ${s.corrigido}`}>
                          Corrigido, ver o que mudou
                        </Link>
                      )}
                    </td>
                    <td>{tipoDoDinheiro(m)}</td>
                    <td>{m.situacao === 'quitado' ? (m.forma_pagamento ?? '') : 'A prazo'}</td>
                    <td className={s.direita}>
                      <span className={s.valor} data-tom={m.situacao === 'pendente' ? 'aberto' : entrada ? 'entrou' : 'saiu'}>
                        {entrada ? '+ ' : '− '}
                        {reais(m.valor)}
                      </span>
                    </td>
                    <td>
                      {m.situacao === 'quitado' ? (
                        <span className="etiqueta etiqueta-verde">
                          {entrada ? 'Recebido' : 'Pago'}
                        </span>
                      ) : (
                        <span className="etiqueta etiqueta-ambar">
                          {entrada ? 'A receber' : 'A pagar'} até {dataCurta(m.vencimento)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className={s.vazio}>
            {ver ? 'Nada nesse filtro este mês.' : `Nenhum dinheiro entrou ou saiu em ${mes.nome}.`}
          </p>
        )}
      </section>
    </div>
  )
}
