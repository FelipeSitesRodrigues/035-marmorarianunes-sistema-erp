import Link from 'next/link'
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { Miniatura } from '@/components/listas/Miniatura'
import { relatorio } from '@/lib/consultas/relatorios'
import { nomeUnidade, numeroBR, qtd, reais } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import { hojeISO, periodoDe } from '@/lib/tempo'
import { Imprimir } from './Imprimir'
import s from './relatorios.module.css'

export const metadata = { title: 'Relatórios' }

const PERIODOS = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
] as const

const celula = (n: number, u: Parameters<typeof nomeUnidade>[0]) => (n ? `${numeroBR(n)} ${nomeUnidade(u, n)}` : '')

export default async function Relatorios({ searchParams }: PageProps<'/relatorios'>) {
  await exigirUsuario()
  const params = await searchParams
  const periodo = periodoDe(
    typeof params.periodo === 'string' ? params.periodo : undefined,
    typeof params.data === 'string' ? params.data : undefined,
  )
  const hoje = hojeISO()
  const { dinheiro, saidas, entradas, estoque } = await relatorio(periodo)
  const saldo = dinheiro.recebido - dinheiro.pago
  const link = (tipo: string, data: string) => `/relatorios?periodo=${tipo}&data=${data}`
  const nomePeriodo = { dia: 'do dia', semana: 'da semana', mes: 'do mês' }[periodo.tipo]
  const abaixo = estoque.filter((m) => m.estoque_minimo > 0 && m.quantidade_fim <= m.estoque_minimo)

  return (
    <div className={s.pagina}>
      <header className={s.topo}>
        <div>
          <h1>Relatórios</h1>
          <p className={s.titulo}>{periodo.titulo}</p>
        </div>
        <Imprimir />
      </header>

      <div className={s.controles}>
        <nav className={s.abas} aria-label="Período">
          {PERIODOS.map((p) => (
            <Link key={p.valor} href={link(p.valor, periodo.referencia)} aria-current={periodo.tipo === p.valor ? 'true' : undefined}>
              {p.rotulo}
            </Link>
          ))}
        </nav>
        <nav className={s.navegar} aria-label="Andar no tempo">
          <Link href={link(periodo.tipo, periodo.anterior)} aria-label="Período anterior">
            <CaretLeft weight="bold" aria-hidden />
          </Link>
          <span>{periodo.titulo}</span>
          <Link href={link(periodo.tipo, periodo.proximo)} aria-label="Próximo período">
            <CaretRight weight="bold" aria-hidden />
          </Link>
        </nav>
        {periodo.inicio > hoje || periodo.fim < hoje ? (
          <Link href={link(periodo.tipo, hoje)} className={s.hoje}>
            Voltar pra hoje
          </Link>
        ) : null}
      </div>

      <section aria-labelledby="dinheiro">
        <h2 id="dinheiro" className={s.secao}>
          Dinheiro {nomePeriodo}
        </h2>
        <dl className={s.cartoes}>
          <div className="cartao">
            <dt>Vendas</dt>
            <dd>{reais(dinheiro.vendido)}</dd>
            <dd className={s.detalhe}>
              {dinheiro.vendas} {dinheiro.vendas === 1 ? 'venda' : 'vendas'}
            </dd>
          </div>
          <div className="cartao">
            <dt>Recebido</dt>
            <dd className={s.verde}>{reais(dinheiro.recebido)}</dd>
            <dd className={s.detalhe}>dinheiro que entrou de verdade</dd>
          </div>
          <div className="cartao">
            <dt>Investido em compras</dt>
            <dd>{reais(dinheiro.comprado)}</dd>
            <dd className={s.detalhe}>
              {dinheiro.compras} {dinheiro.compras === 1 ? 'compra' : 'compras'}
            </dd>
          </div>
          <div className="cartao">
            <dt>Despesas</dt>
            <dd>{reais(dinheiro.despesasValor)}</dd>
            <dd className={s.detalhe}>
              {dinheiro.despesas} {dinheiro.despesas === 1 ? 'conta' : 'contas'}
            </dd>
          </div>
          <div className="cartao">
            <dt>Pago</dt>
            <dd>{reais(dinheiro.pago)}</dd>
            <dd className={s.detalhe}>compras e despesas pagas</dd>
          </div>
          <div className={`cartao ${s.saldo}`}>
            <dt>Saldo {nomePeriodo}</dt>
            <dd data-negativo={saldo < 0 || undefined}>{reais(saldo)}</dd>
            <dd className={s.detalhe}>recebido menos pago</dd>
          </div>
        </dl>
      </section>

      <section className={`cartao ${s.bloco}`} aria-labelledby="saidas">
        <h2 id="saidas">Pedras que saíram</h2>
        {saidas.length === 0 ? (
          <p className={s.vazio}>Nenhuma pedra saiu {nomePeriodo}.</p>
        ) : (
          <>
            <ol className={s.destaques} aria-label="As que mais saíram">
              {saidas.slice(0, 3).map((m, i) => (
                <li key={m.id}>
                  <span className={s.posicao}>{i + 1}º</span>
                  <Miniatura foto={m.foto} tamanho={52} />
                  <span>
                    <strong>{m.nome}</strong>
                    <small>{qtd(m.total, m.unidade)}</small>
                  </span>
                </li>
              ))}
            </ol>
            <div className={s.rolar}>
              <table className={s.tabela}>
                <thead>
                  <tr>
                    <th scope="col">Pedra</th>
                    <th scope="col">Vendida</th>
                    <th scope="col">Usada em obra</th>
                    <th scope="col">Perda ou descarte</th>
                    <th scope="col">Outro</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {saidas.map((m) => (
                    <tr key={m.id}>
                      <th scope="row">
                        <Link href={`/estoque/${m.id}`}>{m.nome}</Link>
                      </th>
                      <td>{celula(m.vendida, m.unidade)}</td>
                      <td>{celula(m.obra, m.unidade)}</td>
                      <td>{celula(m.perda, m.unidade)}</td>
                      <td>{celula(m.outro, m.unidade)}</td>
                      <td>
                        <strong>{qtd(m.total, m.unidade)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className={`cartao ${s.bloco}`} aria-labelledby="entradas">
        <h2 id="entradas">Pedras compradas</h2>
        {entradas.length === 0 ? (
          <p className={s.vazio}>Nenhuma compra {nomePeriodo}.</p>
        ) : (
          <div className={s.rolar}>
            <table className={s.tabela}>
              <thead>
                <tr>
                  <th scope="col">Pedra</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">
                      <Link href={`/estoque/${m.id}`}>{m.nome}</Link>
                    </th>
                    <td>{qtd(m.quantidade, m.unidade)}</td>
                    <td>{reais(m.valor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td />
                  <td>{reais(entradas.reduce((t, m) => t + m.valor, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className={`cartao ${s.bloco}`} aria-labelledby="restante">
        <h2 id="restante">Quanto ficou de cada pedra</h2>
        <p className={s.explica}>
          No fim do período ({periodo.fim >= hoje ? 'hoje' : `em ${periodo.fim.split('-').reverse().join('/')}`}).
          {abaixo.length > 0 && ` ${abaixo.length} ${abaixo.length === 1 ? 'estava' : 'estavam'} no mínimo ou abaixo.`}
        </p>
        {estoque.length === 0 ? (
          <p className={s.vazio}>Nenhum material cadastrado.</p>
        ) : (
          <div className={s.rolar}>
            <table className={s.tabela}>
              <thead>
                <tr>
                  <th scope="col">Pedra</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Mínimo</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {estoque.map((m) => {
                  const baixo = m.estoque_minimo > 0 && m.quantidade_fim <= m.estoque_minimo
                  return (
                    <tr key={m.id}>
                      <th scope="row">
                        <Link href={`/estoque/${m.id}`}>{m.nome}</Link>
                      </th>
                      <td>{qtd(m.quantidade_fim, m.unidade)}</td>
                      <td>{m.estoque_minimo > 0 ? qtd(m.estoque_minimo, m.unidade) : ''}</td>
                      <td>
                        {baixo ? (
                          <span className="etiqueta etiqueta-ambar">Precisa repor</span>
                        ) : (
                          <span className="etiqueta etiqueta-verde">Em dia</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
