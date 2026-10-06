import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CaretLeft, PencilSimple, Warning } from '@phosphor-icons/react/dist/ssr'
import { descricao, PREPOSICAO_FORMA, rotuloTipo, situacao } from '@/components/listas/descrever'
import { Miniatura } from '@/components/listas/Miniatura'
import { correcaoQueGerou, eventosDa, lancamentosDa, movimentosDa, operacaoPorNumero, type Evento } from '@/lib/consultas/historico'
import { dataCompleta, dataCurta, qtd, reais, type Unidade } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import { hojeISO } from '@/lib/tempo'
import type { Resumo } from '@/lib/tipos'
import { Cancelar, Reabrir } from './Acoes'
import s from './detalhe.module.css'

export async function generateMetadata({ params }: PageProps<'/historico/[numero]'>) {
  return { title: `Lançamento nº ${(await params).numero}` }
}

const NOME_TIPO: Record<string, string> = {
  venda: 'Venda',
  compra: 'Compra',
  saida: 'Saída',
  despesa: 'Despesa',
  cadastro: 'Cadastro de material',
  ajuste: 'Ajuste de estoque',
}

const quandoFoi = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Bahia',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(',', ' às')

function fraseEvento(e: Evento) {
  const d = e.detalhes as Record<string, string | number | null>
  const forma = d.forma ? ` ${PREPOSICAO_FORMA[String(d.forma)] ?? String(d.forma)}` : ''
  switch (e.acao) {
    case 'recebeu':
      return `marcou que recebeu ${reais(Number(d.valor))}${forma}`
    case 'pagou':
      return `marcou que pagou ${reais(Number(d.valor))}${forma}`
    case 'reabriu conta':
      return `desfez um ${d.natureza === 'entrada' ? 'recebimento' : 'pagamento'} de ${reais(Number(d.valor))}`
    case 'mudou vencimento':
      return `mudou a data de ${dataCurta(String(d.antes))} para ${dataCurta(String(d.depois))}`
    case 'corrigiu':
      return `corrigiu este lançamento${d.motivo ? `: "${d.motivo}"` : ''}`
    case 'cancelou':
      return `cancelou este lançamento${d.motivo ? `: "${d.motivo}"` : ''}`
    case 'ajustou estoque':
      return 'ajustou o estoque'
    default:
      return e.acao
  }
}

/** O que mudou entre a versão original e a correção, em linhas "antes → agora". */
function diferencas(antes: Resumo, depois: Resumo) {
  const linhas: { campo: string; antes: string; depois: string }[] = []
  if (antes.valor_total !== depois.valor_total)
    linhas.push({ campo: 'Valor', antes: reais(antes.valor_total), depois: reais(depois.valor_total) })
  if ((antes.contraparte ?? '') !== (depois.contraparte ?? ''))
    linhas.push({ campo: 'Nome', antes: antes.contraparte ?? 'sem nome', depois: depois.contraparte ?? 'sem nome' })
  const ids = new Set([...antes.materiais.map((m) => m.id), ...depois.materiais.map((m) => m.id)])
  for (const id of ids) {
    const a = antes.materiais.find((m) => m.id === id)
    const b = depois.materiais.find((m) => m.id === id)
    const ref = (b ?? a)!
    const u = ref.unidade as Unidade
    const qa = Math.abs(a?.movido ?? 0)
    const qb = Math.abs(b?.movido ?? 0)
    if (qa !== qb) linhas.push({ campo: ref.nome, antes: qa ? qtd(qa, u) : 'não tinha', depois: qb ? qtd(qb, u) : 'saiu da lista' })
  }
  return linhas
}

export default async function Detalhe({ params }: PageProps<'/historico/[numero]'>) {
  await exigirUsuario()
  const numero = Number((await params).numero)
  const op = await operacaoPorNumero(numero)
  if (!op) notFound()
  const hoje = hojeISO()

  const [lancamentos, movimentos, eventos, correcao] = await Promise.all([
    lancamentosDa(op.id),
    movimentosDa(op.id),
    eventosDa(op.id),
    op.substitui_id ? correcaoQueGerou(op.substitui_id) : null,
  ])
  const tipo = rotuloTipo(op)
  const sit = situacao(op, hoje)
  const ativa = op.situacao === 'ativa'
  const corrigivel = ativa && ['venda', 'compra', 'saida', 'despesa'].includes(op.tipo)
  const mudancas = correcao ? diferencas(correcao.antes, correcao.depois) : []

  const pessoa: Record<string, string> = { venda: 'Cliente', compra: 'Fornecedor', despesa: 'Pago a', cadastro: 'Fornecedor' }
  const referencia: Record<string, string> = { venda: 'Serviço', saida: op.motivo === 'obra' ? 'Obra' : 'O que aconteceu' }

  return (
    <div className={s.pagina}>
      <Link href="/historico" className={s.voltar}>
        <CaretLeft weight="bold" aria-hidden />
        Histórico
      </Link>

      <header className={s.topo}>
        <div className={s.etiquetas}>
          <span className={`etiqueta etiqueta-${tipo.tom}`}>{tipo.texto}</span>
          <span className={`etiqueta etiqueta-${sit.tom}`}>{sit.texto}</span>
          <span className={s.numero}>nº {op.numero}</span>
        </div>
        <h1>{descricao(op)}</h1>
        <p className={s.meta}>
          {NOME_TIPO[op.tipo]} de {dataCompleta(op.data)}. Registrado por {op.criado_por_nome ?? 'alguém'} em {quandoFoi(op.criado_em)}.
        </p>
      </header>

      {op.situacao === 'corrigida' && (
        <div className={s.faixa}>
          <Warning weight="fill" aria-hidden />
          <p>
            Este lançamento foi <strong>corrigido</strong>
            {op.alterada_em ? ` em ${quandoFoi(op.alterada_em)}` : ''}
            {op.motivo_alteracao ? ` ("${op.motivo_alteracao}")` : ''}. Ele fica guardado só como registro: não conta no estoque nem no
            dinheiro.
          </p>
          {op.numero_substituida && (
            <Link href={`/historico/${op.numero_substituida}`} className="botao botao-pequeno">
              Ver a versão certa, nº {op.numero_substituida}
              <ArrowRight aria-hidden />
            </Link>
          )}
        </div>
      )}

      {op.situacao === 'cancelada' && (
        <div className={s.faixa}>
          <Warning weight="fill" aria-hidden />
          <p>
            Este lançamento foi <strong>cancelado</strong>
            {op.alterada_em ? ` em ${quandoFoi(op.alterada_em)}` : ''}
            {op.motivo_alteracao ? ` ("${op.motivo_alteracao}")` : ''}. O estoque e o dinheiro dele voltaram como estavam.
          </p>
        </div>
      )}

      {op.numero_substitui && (
        <section className={`cartao ${s.mudou}`} aria-labelledby="mudou">
          <h2 id="mudou">O que mudou na correção</h2>
          {mudancas.length ? (
            <ul>
              {mudancas.map((m) => (
                <li key={m.campo}>
                  <span>{m.campo}</span>
                  <s>{m.antes}</s>
                  <ArrowRight aria-hidden />
                  <strong>{m.depois}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Valor e pedras continuaram iguais; mudou outro detalhe (data, nome do serviço ou observação).</p>
          )}
          <Link href={`/historico/${op.numero_substitui}`} className="link-acao">
            Ver como era, nº {op.numero_substitui}
          </Link>
        </section>
      )}

      <div className={s.colunas}>
        <section className={`cartao ${s.bloco}`} aria-labelledby="detalhes">
          <h2 id="detalhes">Detalhes</h2>
          <dl className={s.detalhes}>
            {op.contraparte && pessoa[op.tipo] && (
              <div>
                <dt>{pessoa[op.tipo]}</dt>
                <dd>{op.contraparte}</dd>
              </div>
            )}
            {op.referencia && referencia[op.tipo] && (
              <div>
                <dt>{referencia[op.tipo]}</dt>
                <dd>{op.referencia}</dd>
              </div>
            )}
            {op.tipo === 'despesa' && (
              <div>
                <dt>Tipo de despesa</dt>
                <dd>{op.categoria}</dd>
              </div>
            )}
            {op.tipo === 'ajuste' && op.motivo && (
              <div>
                <dt>Motivo</dt>
                <dd>{op.motivo}</dd>
              </div>
            )}
            <div>
              <dt>Data</dt>
              <dd>{dataCompleta(op.data)}</dd>
            </div>
            {['venda', 'compra', 'despesa'].includes(op.tipo) && (
              <div>
                <dt>Valor total</dt>
                <dd className={s.valor}>{reais(op.valor_total)}</dd>
              </div>
            )}
            {op.observacoes && (
              <div>
                <dt>Observação</dt>
                <dd>{op.observacoes}</dd>
              </div>
            )}
          </dl>

          {movimentos.length > 0 && (
            <>
              <h3 className={s.subtitulo}>Pedras</h3>
              <ul className={s.pedras}>
                {movimentos.map((m) => (
                  <li key={m.id} data-estorno={m.estorno || undefined}>
                    <Miniatura foto={m.foto} tamanho={44} />
                    <span>
                      <Link href={`/estoque/${m.material_id}`}>
                        <strong>{m.nome}</strong>
                      </Link>
                      <small>
                        {m.estorno ? 'Desfeito: ' : ''}
                        {m.sentido > 0 ? 'entrou' : 'saiu'} {qtd(m.quantidade, m.unidade)}, ficou com {qtd(m.saldo_depois, m.unidade)}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {op.tipo === 'venda' && movimentos.length === 0 && <p className={s.nota}>Venda só de serviço: nenhuma pedra saiu do estoque.</p>}
          {['saida', 'ajuste', 'cadastro'].includes(op.tipo) && (
            <p className={s.nota}>Este lançamento mexe só no estoque. O dinheiro não muda.</p>
          )}
        </section>

        <div className={s.lado}>
          {lancamentos.length > 0 && (
            <section className={`cartao ${s.bloco}`} aria-labelledby="dinheiro">
              <h2 id="dinheiro">Dinheiro</h2>
              <ul className={s.dinheiro}>
                {lancamentos.map((l) => {
                  const entrada = l.natureza === 'entrada'
                  return (
                    <li key={l.id} data-cancelado={l.situacao === 'cancelado' || undefined}>
                      <span className={s.dinheiroValor}>{reais(l.valor)}</span>
                      <span className={s.dinheiroTexto}>
                        {l.situacao === 'quitado'
                          ? `${entrada ? 'Recebido' : 'Pago'} em ${dataCurta(l.quitado_em!)}${l.forma_pagamento ? ` ${PREPOSICAO_FORMA[l.forma_pagamento] ?? l.forma_pagamento}` : ''}`
                          : l.situacao === 'pendente'
                            ? `${entrada ? 'A receber' : 'A pagar'} até ${dataCurta(l.vencimento)}`
                            : 'Cancelado (não conta mais)'}
                      </span>
                      {ativa && l.situacao === 'quitado' && <Reabrir id={l.id} natureza={l.natureza} />}
                      {ativa && l.situacao === 'pendente' && (
                        <Link href={`/financeiro#${entrada ? 'receber' : 'pagar'}`} className={s.dinheiroLink}>
                          {entrada ? 'Marcar recebido' : 'Marcar pago'}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className={`cartao ${s.bloco}`} aria-labelledby="linha">
            <h2 id="linha">O que aconteceu</h2>
            <ol className={s.eventos}>
              <li>
                <time>{quandoFoi(op.criado_em)}</time>
                <span>
                  {op.criado_por_nome ?? 'Alguém'} registrou {op.numero_substitui ? 'esta correção' : 'o lançamento'}
                </span>
              </li>
              {eventos
                .filter((e) => !/^(registrou|lançou|cadastrou)/.test(e.acao))
                .map((e) => (
                  <li key={e.id}>
                    <time>{quandoFoi(e.criado_em)}</time>
                    <span>
                      {e.usuario ?? 'Alguém'} {fraseEvento(e)}
                    </span>
                  </li>
                ))}
            </ol>
          </section>
        </div>
      </div>

      {ativa && (
        <section className={s.acoes} aria-label="Corrigir ou cancelar">
          {corrigivel && (
            <Link href={`/historico/${op.numero}?corrigir=${op.id}`} className="botao" scroll={false}>
              <PencilSimple aria-hidden />
              Corrigir este lançamento
            </Link>
          )}
          <Cancelar id={op.id} tipo={op.tipo} />
          <p className={s.notaAcoes}>
            Corrigir guarda o original aqui no histórico e cria a versão certa. Cancelar desfaz o efeito no estoque e no dinheiro.
          </p>
        </section>
      )}
    </div>
  )
}
