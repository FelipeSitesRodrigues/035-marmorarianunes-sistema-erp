import Link from 'next/link'
import {
  ArrowDown,
  ArrowsLeftRight,
  ArrowUp,
  CaretRight,
  CreditCard,
  Cube,
  Receipt,
  ShoppingCart,
  Storefront,
  Tag,
  Users,
  Warning,
} from '@phosphor-icons/react/dist/ssr'
import { LinhaOperacao } from '@/components/listas/LinhaOperacao'
import listas from '@/components/listas/listas.module.css'
import { SeletorMes } from '@/components/listas/SeletorMes'
import { Miniatura } from '@/components/listas/Miniatura'
import { ACOES } from '@/components/registro/acoes'
import { ultimasOperacoes } from '@/lib/consultas/comum'
import { contasEmAberto, resumoDoMes, resumoEstoque } from '@/lib/consultas/inicio'
import { dataCurta, dataPorExtenso, diasEntre, numeroBR, qtd, reais } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import { hojeISO, mesDe, saudacao } from '@/lib/tempo'
import s from './inicio.module.css'

export const metadata = { title: 'Início' }

/** "vence hoje", "vence amanhã", "vence dia 08/10" (só na próxima semana) */
function proximoVencimento(data: string | null, hoje: string) {
  if (!data) return null
  const dias = diasEntre(hoje, data)
  if (dias === 0) return 'vence hoje'
  if (dias === 1) return 'vence amanhã'
  if (dias <= 7) return `vence dia ${dataCurta(data)}`
  return null
}

const ICONES = { venda: Tag, compra: ShoppingCart, saida: ArrowsLeftRight, despesa: Receipt, material: Cube }

export default async function Inicio({ searchParams }: PageProps<'/'>) {
  const usuario = await exigirUsuario()
  const params = await searchParams
  const mes = mesDe(params.mes)
  const hoje = hojeISO()

  const [resumo, contas, estoque, ultimas] = await Promise.all([
    resumoDoMes(mes),
    contasEmAberto(hoje),
    resumoEstoque(4),
    ultimasOperacoes(5),
  ])
  const saldo = resumo.entrou - resumo.saiu
  const linkAcao = (tipo: string) => `/?${new URLSearchParams({ ...(mes.atual ? {} : { mes: mes.chave }), registrar: tipo })}`

  return (
    <div className={s.pagina}>
      <header className={s.topo}>
        <div>
          <h1>
            {saudacao()}, {usuario.nome.split(' ')[0]}
          </h1>
          <p className={s.data}>{dataPorExtenso(hoje)}</p>
        </div>
        <SeletorMes mes={mes} caminho="/" />
      </header>

      <section aria-labelledby="acoes-titulo">
        <h2 id="acoes-titulo" className={s.tituloSecao}>
          O que você quer fazer?
        </h2>
        <ul className={s.acoes}>
          {ACOES.map(({ tipo, titulo, explicacao }) => {
            const Icone = ICONES[tipo]
            return (
              <li key={tipo}>
                <Link href={linkAcao(tipo)} className={s.acao} scroll={false}>
                  <span className="selo">
                    <Icone aria-hidden />
                  </span>
                  <span className={s.acaoTexto}>
                    <strong>{titulo}</strong>
                    <span>{explicacao}</span>
                  </span>
                  <CaretRight className={s.seta} weight="bold" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <div className={s.blocos}>
        <section className={`cartao ${s.mes}`} aria-labelledby="mes-titulo">
          <div className={s.marmore}>
            <h2 id="mes-titulo" className={s.mesTitulo}>
              Como está {mes.nome}
            </h2>
            <p className={s.saldoRotulo}>Saldo do mês</p>
            <p className={s.saldo} data-negativo={saldo < 0 || undefined}>
              {reais(saldo)}
            </p>
            <dl className={s.caixa}>
              <div>
                <dt>
                  <ArrowUp weight="bold" className={s.sobe} aria-hidden />
                  Entrou
                </dt>
                <dd className={s.entrou}>{reais(resumo.entrou)}</dd>
              </div>
              <div>
                <dt>
                  <ArrowDown weight="bold" aria-hidden />
                  Saiu
                </dt>
                <dd>{reais(resumo.saiu)}</dd>
              </div>
            </dl>
          </div>
          <dl className={s.mesNumeros}>
            <div>
              <span className="selo" aria-hidden>
                <Storefront />
              </span>
              <dt>Vendido</dt>
              <dd>
                {reais(resumo.vendido)}
                <small>
                  {resumo.vendas} {resumo.vendas === 1 ? 'venda' : 'vendas'}
                </small>
              </dd>
            </div>
            <div>
              <span className="selo" aria-hidden>
                <ShoppingCart />
              </span>
              <dt>Comprado</dt>
              <dd>
                {reais(resumo.comprado)}
                <small>
                  {resumo.compras} {resumo.compras === 1 ? 'compra' : 'compras'}
                </small>
              </dd>
            </div>
            <div>
              <span className="selo" aria-hidden>
                <Receipt />
              </span>
              <dt>Despesas</dt>
              <dd>
                {reais(resumo.despesas)}
                <small>no mês</small>
              </dd>
            </div>
          </dl>
        </section>

        <section className={`cartao ${s.bloco}`} aria-labelledby="contas-titulo">
          <Link href="/financeiro" className={s.blocoTopo}>
            <h2 id="contas-titulo">Contas em aberto</h2>
            <CaretRight weight="bold" aria-hidden />
          </Link>
          <Link href="/financeiro#receber" className={s.conta}>
            <span className="selo" aria-hidden>
              <Users />
            </span>
            <span className={s.contaTexto}>
              <span className={s.contaRotulo}>
                <span className={s.contaNome}>A receber</span>
                {contas.receber.atrasadas > 0 ? (
                  <span className="etiqueta etiqueta-ambar">
                    {contas.receber.atrasadas} {contas.receber.atrasadas === 1 ? 'atrasado' : 'atrasados'}
                  </span>
                ) : proximoVencimento(contas.receber.proximo, hoje) ? (
                  <span className="etiqueta etiqueta-cinza">{proximoVencimento(contas.receber.proximo, hoje)}</span>
                ) : null}
              </span>
              <strong>{reais(contas.receber.total)}</strong>
              <small>
                {contas.receber.pessoas === 0
                  ? 'Ninguém deve nada agora'
                  : `${contas.receber.pessoas} ${contas.receber.pessoas === 1 ? 'cliente ainda vai pagar' : 'clientes ainda vão pagar'}`}
              </small>
            </span>
            <CaretRight weight="bold" className={s.seta} aria-hidden />
          </Link>
          <Link href="/financeiro#pagar" className={s.conta}>
            <span className="selo" aria-hidden>
              <CreditCard />
            </span>
            <span className={s.contaTexto}>
              <span className={s.contaRotulo}>
                <span className={s.contaNome}>A pagar</span>
                {contas.pagar.atrasadas > 0 ? (
                  <span className="etiqueta etiqueta-ambar">
                    {contas.pagar.atrasadas} {contas.pagar.atrasadas === 1 ? 'vencida' : 'vencidas'}
                  </span>
                ) : proximoVencimento(contas.pagar.proximo, hoje) ? (
                  <span className="etiqueta etiqueta-ambar">{proximoVencimento(contas.pagar.proximo, hoje)}</span>
                ) : null}
              </span>
              <strong>{reais(contas.pagar.total)}</strong>
              <small>
                {contas.pagar.contas === 0
                  ? 'Nenhuma conta em aberto'
                  : `${contas.pagar.contas} ${contas.pagar.contas === 1 ? 'conta' : 'contas'}`}
              </small>
            </span>
            <CaretRight weight="bold" className={s.seta} aria-hidden />
          </Link>
          <Link href="/financeiro" className={`link-acao ${s.blocoLink}`}>
            Ver no Financeiro <CaretRight weight="bold" aria-hidden />
          </Link>
        </section>

        <section className={`cartao ${s.bloco}`} aria-labelledby="estoque-titulo">
          <Link href="/estoque" className={s.blocoTopo}>
            <h2 id="estoque-titulo">Estoque</h2>
            <CaretRight weight="bold" aria-hidden />
          </Link>
          <dl className={s.estoqueNumeros}>
            <div>
              <dd>{estoque.materiais}</dd>
              <dt>materiais cadastrados</dt>
            </div>
            <div>
              <dt>Valor do estoque</dt>
              <dd>{reais(estoque.valor)}</dd>
              <dt className={s.pequeno}>(pelo preço de compra)</dt>
            </div>
          </dl>
          {estoque.repor > 0 ? (
            <>
              <Link href="/estoque?repor=1" className={s.repor}>
                <Warning weight="bold" aria-hidden />
                {estoque.repor} {estoque.repor === 1 ? 'precisa de reposição' : 'precisam de reposição'}
                <CaretRight weight="bold" className={s.seta} aria-hidden />
              </Link>
              <ul className={s.reporLista}>
                {estoque.lista.map((m) => (
                  <li key={m.id}>
                    <Link href={`/estoque/${m.id}`}>
                      <Miniatura foto={m.foto} categoria={m.categoria} tamanho={44} />
                      <span>
                        <strong>{m.nome}</strong>
                        <small>
                          {qtd(m.quantidade, m.unidade)}, mínimo {numeroBR(m.estoque_minimo)}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={s.tudoCerto}>
              {estoque.materiais === 0
                ? 'Nenhum material cadastrado ainda. Comece em Cadastrar material.'
                : 'Nenhuma pedra abaixo do mínimo.'}
            </p>
          )}
        </section>
      </div>

      <section className={`cartao ${s.ultimas}`} aria-labelledby="ultimas-titulo">
        <Link href="/historico" className={s.blocoTopo}>
          <h2 id="ultimas-titulo">Últimas movimentações</h2>
          <CaretRight weight="bold" aria-hidden />
        </Link>
        {ultimas.length ? (
          <ul className={listas.lista}>
            {ultimas.map((op) => (
              <LinhaOperacao key={op.id} op={op} hoje={hoje} comHora />
            ))}
          </ul>
        ) : (
          <p className={s.tudoCerto}>Nada registrado ainda. Use os botões acima: cada registro aparece aqui.</p>
        )}
        <Link href="/historico" className="link-acao">
          Ver histórico completo <CaretRight weight="bold" aria-hidden />
        </Link>
      </section>
    </div>
  )
}
