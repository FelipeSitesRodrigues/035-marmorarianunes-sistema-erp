import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowDown, ArrowUp, CaretLeft, PencilSimple, Scales, ShoppingCart, Tag } from '@phosphor-icons/react/dist/ssr'
import { ROTULO_MOTIVO } from '@/components/listas/descrever'
import { Miniatura } from '@/components/listas/Miniatura'
import { materialPorId, movimentosDoMaterial, totalComprado, type MovimentoMaterial } from '@/lib/consultas/estoque'
import { dataCurta, nomeUnidade, numeroBR, qtd, reais } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import { Arquivar } from './Arquivar'
import s from './material.module.css'

export async function generateMetadata({ params }: PageProps<'/estoque/[id]'>) {
  const m = await materialPorId((await params).id)
  return { title: m?.nome ?? 'Material' }
}

function oQueFoi(mv: MovimentoMaterial) {
  if (mv.estorno) return mv.situacao === 'corrigida' ? 'Correção (desfez o lançamento original)' : 'Cancelado (voltou ao estoque)'
  switch (mv.tipo) {
    case 'cadastro':
      return 'Estoque inicial'
    case 'compra':
      return `Compra${mv.contraparte ? `, de ${mv.contraparte}` : ''}`
    case 'venda':
      return `Venda${mv.contraparte ? ` para ${mv.contraparte}` : ''}${mv.referencia ? ` (${mv.referencia})` : ''}`
    case 'saida':
      return `${ROTULO_MOTIVO[mv.motivo ?? 'outro']}${mv.referencia ? `, ${mv.referencia}` : ''}`
    case 'ajuste':
      return `Ajuste${mv.motivo ? `: ${mv.motivo}` : ''}`
    default:
      return 'Movimento'
  }
}

export default async function Material({ params }: PageProps<'/estoque/[id]'>) {
  await exigirUsuario()
  const { id } = await params
  const m = await materialPorId(id)
  if (!m) notFound()
  const [movimentos, comprado] = await Promise.all([movimentosDoMaterial(id), totalComprado(id)])
  const baixo = m.estoque_minimo > 0 && m.quantidade <= m.estoque_minimo
  const link = (tipo: string) => `/estoque/${id}?registrar=${tipo}&material=${id}`

  return (
    <div className={s.pagina}>
      <Link href="/estoque" className={s.voltar}>
        <CaretLeft weight="bold" aria-hidden />
        Estoque
      </Link>

      <header className={s.topo}>
        <Miniatura foto={m.foto} categoria={m.categoria} tamanho={104} />
        <div className={s.titulo}>
          <h1>{m.nome}</h1>
          <p>
            {m.categoria}
            {m.fornecedor ? `, fornecedor ${m.fornecedor}` : ''}
          </p>
          {!m.ativo ? (
            <span className="etiqueta etiqueta-cinza">Arquivado</span>
          ) : m.quantidade <= 0 ? (
            <span className="etiqueta etiqueta-ambar">Sem estoque</span>
          ) : baixo ? (
            <span className="etiqueta etiqueta-ambar">Precisa repor</span>
          ) : (
            <span className="etiqueta etiqueta-verde">Em dia</span>
          )}
        </div>
      </header>

      {m.ativo && (
        <nav className={s.acoes} aria-label="O que fazer com esta pedra">
          <Link href={link('compra')} className="botao botao-principal" scroll={false}>
            <ShoppingCart aria-hidden />
            Registrar compra
          </Link>
          <Link href={link('venda')} className="botao" scroll={false}>
            <Tag aria-hidden />
            Registrar venda
          </Link>
          <Link href={link('saida')} className="botao" scroll={false}>
            <ArrowDown aria-hidden />
            Registrar saída
          </Link>
          <Link href={link('ajuste')} className="botao" scroll={false}>
            <Scales aria-hidden />
            Ajustar estoque
          </Link>
          <Link href={link('editar')} className="botao" scroll={false}>
            <PencilSimple aria-hidden />
            Editar
          </Link>
        </nav>
      )}

      <dl className={s.numeros}>
        <div className="cartao">
          <dt>Tem hoje</dt>
          <dd data-baixo={baixo || undefined}>
            {numeroBR(m.quantidade)} <span>{nomeUnidade(m.unidade, m.quantidade)}</span>
          </dd>
        </div>
        <div className="cartao">
          <dt>Avisa quando ficar com</dt>
          <dd>{m.estoque_minimo > 0 ? qtd(m.estoque_minimo, m.unidade) : 'Sem aviso'}</dd>
        </div>
        <div className="cartao">
          <dt>Custo médio</dt>
          <dd>
            {reais(m.custo_medio)} <span>por {nomeUnidade(m.unidade, 1)}</span>
          </dd>
        </div>
        <div className="cartao">
          <dt>Valor no estoque</dt>
          <dd>{reais(Math.round(m.quantidade * m.custo_medio * 100) / 100)}</dd>
        </div>
        <div className="cartao">
          <dt>Comprado até hoje</dt>
          <dd>
            {reais(comprado.total)}
            {comprado.quantidade > 0 && <span> em {qtd(comprado.quantidade, m.unidade)}</span>}
          </dd>
        </div>
      </dl>

      {m.observacoes && (
        <p className={s.observacao}>
          <strong>Observação:</strong> {m.observacoes}
        </p>
      )}

      <section className={`cartao ${s.historico}`} aria-labelledby="hist">
        <h2 id="hist">Histórico desta pedra</h2>
        {movimentos.length === 0 ? (
          <p className={s.vazio}>Nenhuma entrada ou saída ainda.</p>
        ) : (
          <ol className={s.movimentos}>
            {movimentos.map((mv) => (
              <li key={mv.id}>
                <Link href={`/historico/${mv.numero}`} className={s.movimento} data-riscado={mv.situacao !== 'ativa' || undefined}>
                  <span className={s.movData}>{dataCurta(mv.data)}</span>
                  <span className={s.movSinal} data-entrada={mv.sentido > 0 || undefined}>
                    {mv.sentido > 0 ? <ArrowUp weight="bold" aria-hidden /> : <ArrowDown weight="bold" aria-hidden />}
                    {mv.sentido > 0 ? '+' : '−'}
                    {qtd(mv.quantidade, m.unidade)}
                  </span>
                  <span className={s.movTexto}>{oQueFoi(mv)}</span>
                  <span className={s.movSaldo}>ficou com {qtd(mv.saldo_depois, m.unidade)}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {m.ativo && m.quantidade <= 0 && <Arquivar id={m.id} nome={m.nome} />}
    </div>
  )
}
