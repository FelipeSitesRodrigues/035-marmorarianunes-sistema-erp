import Link from 'next/link'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { LinhaOperacao } from '@/components/listas/LinhaOperacao'
import listas from '@/components/listas/listas.module.css'
import { operacoesFiltradas } from '@/lib/consultas/comum'
import { dataPorExtenso } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import { hojeISO } from '@/lib/tempo'
import type { OperacaoLinha } from '@/lib/tipos'
import s from './historico.module.css'

export const metadata = { title: 'Histórico' }

const TIPOS = [
  { valor: '', rotulo: 'Tudo' },
  { valor: 'vendas', rotulo: 'Vendas' },
  { valor: 'compras', rotulo: 'Compras' },
  { valor: 'saidas', rotulo: 'Saídas' },
  { valor: 'despesas', rotulo: 'Despesas' },
  { valor: 'estoque', rotulo: 'Cadastros e ajustes' },
]

const dataValida = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)

export default async function Historico({ searchParams }: PageProps<'/historico'>) {
  await exigirUsuario()
  const params = await searchParams
  const busca = typeof params.q === 'string' ? params.q.slice(0, 80) : ''
  const tipo = typeof params.tipo === 'string' && TIPOS.some((t) => t.valor === params.tipo) ? params.tipo : ''
  const de = dataValida(params.de)
  const ate = dataValida(params.ate)
  const pagina = Math.max(1, Math.min(500, Number(params.pagina) || 1))
  const hoje = hojeISO()

  const { linhas, temMais } = await operacoesFiltradas({ busca, tipo, de, ate, pagina })

  const link = (mudar: Record<string, string | undefined>) => {
    const atual: Record<string, string | undefined> = { q: busca || undefined, tipo: tipo || undefined, de, ate, ...mudar }
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(atual)) if (v) p.set(k, v)
    return `/historico${p.toString() ? `?${p}` : ''}`
  }

  // Agrupa por dia
  const dias: { data: string; ops: OperacaoLinha[] }[] = []
  for (const op of linhas) {
    const ultimo = dias.at(-1)
    if (ultimo?.data === op.data) ultimo.ops.push(op)
    else dias.push({ data: op.data, ops: [op] })
  }
  const filtrando = !!(busca || tipo || de || ate)

  return (
    <div className={s.pagina}>
      <header>
        <h1>Histórico</h1>
        <p className={s.ajuda}>Tudo o que foi registrado, do mais novo pro mais antigo. Nada é apagado: o que foi corrigido ou cancelado fica aqui, riscado.</p>
      </header>

      <form action="/historico" className={`cartao ${s.filtros}`} role="search">
        {tipo && <input type="hidden" name="tipo" value={tipo} />}
        <div className={s.busca}>
          <label htmlFor="q">Procurar</label>
          <div>
            <MagnifyingGlass aria-hidden />
            <input id="q" name="q" className="entrada" defaultValue={busca} placeholder="Cliente, fornecedor, pedra ou nº" autoComplete="off" />
          </div>
        </div>
        <div className={s.periodo}>
          <div>
            <label htmlFor="de">De</label>
            <input id="de" name="de" type="date" className="entrada" defaultValue={de} />
          </div>
          <div>
            <label htmlFor="ate">Até</label>
            <input id="ate" name="ate" type="date" className="entrada" defaultValue={ate} />
          </div>
        </div>
        <div className={s.filtrosBotoes}>
          <button type="submit" className="botao botao-principal">
            Procurar
          </button>
          {filtrando && (
            <Link href="/historico" className="botao">
              Limpar
            </Link>
          )}
        </div>
      </form>

      <nav className={s.tipos} aria-label="Tipo de lançamento">
        {TIPOS.map((t) => (
          <Link key={t.valor} href={link({ tipo: t.valor || undefined, pagina: undefined })} aria-current={tipo === t.valor ? 'true' : undefined}>
            {t.rotulo}
          </Link>
        ))}
      </nav>

      {dias.length === 0 ? (
        <div className={`cartao ${s.vazio}`}>
          <p>{filtrando ? 'Nada encontrado com esses filtros.' : 'Nada registrado ainda.'}</p>
        </div>
      ) : (
        <div className={`cartao ${s.lista}`}>
          {dias.map((d) => (
            <section key={d.data} aria-label={dataPorExtenso(d.data)}>
              <h2 className={s.dia}>{dataPorExtenso(d.data)}</h2>
              <ul className={listas.lista}>
                {d.ops.map((op) => (
                  <LinhaOperacao key={op.id} op={op} hoje={hoje} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {(pagina > 1 || temMais) && (
        <nav className={s.paginas} aria-label="Páginas">
          {pagina > 1 && (
            <Link href={link({ pagina: String(pagina - 1) })} className="botao">
              Mais novos
            </Link>
          )}
          {temMais && (
            <Link href={link({ pagina: String(pagina + 1) })} className="botao">
              Mais antigos
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
