import Link from 'next/link'
import { ArrowDown, ArrowUp, MagnifyingGlass, Plus, Warning } from '@phosphor-icons/react/dist/ssr'
import { Miniatura } from '@/components/listas/Miniatura'
import { materiaisAtivos } from '@/lib/consultas/comum'
import { CATEGORIAS, nomeUnidade, numeroBR, qtd, reais } from '@/lib/formatos'
import { exigirUsuario } from '@/lib/sessao'
import type { MaterialOpcao } from '@/lib/tipos'
import s from './estoque.module.css'

export const metadata = { title: 'Estoque' }

const PLURAL: Record<string, string> = {
  Granito: 'Granitos',
  Mármore: 'Mármores',
  Quartzito: 'Quartzitos',
  Sinterizado: 'Sinterizados',
  Insumo: 'Insumos',
  Outro: 'Outros',
}

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const precisaRepor = (m: MaterialOpcao) => m.estoque_minimo > 0 && m.quantidade <= m.estoque_minimo

export default async function Estoque({ searchParams }: PageProps<'/estoque'>) {
  await exigirUsuario()
  const params = await searchParams
  const busca = typeof params.q === 'string' ? params.q.slice(0, 60) : ''
  const categoria = typeof params.cat === 'string' && (CATEGORIAS as readonly string[]).includes(params.cat) ? params.cat : null
  const repor = params.repor === '1'

  const todos = await materiaisAtivos()
  const valorTotal = todos.reduce((t, m) => t + Math.round(m.quantidade * m.custo_medio * 100) / 100, 0)
  const qtdRepor = todos.filter(precisaRepor).length
  const categoriasUsadas = CATEGORIAS.filter((c) => todos.some((m) => m.categoria === c))

  const termo = semAcento(busca.trim())
  const lista = todos
    .filter((m) => !termo || semAcento(m.nome).includes(termo) || semAcento(m.fornecedor ?? '').includes(termo))
    .filter((m) => !categoria || m.categoria === categoria)
    .filter((m) => !repor || precisaRepor(m))
    // Quem precisa de reposição sobe pro topo
    .sort((a, b) => Number(precisaRepor(b)) - Number(precisaRepor(a)) || a.nome.localeCompare(b.nome, 'pt-BR'))

  const filtro = (mudar: Record<string, string | null>) => {
    const p = new URLSearchParams()
    const atual = { q: busca || null, cat: categoria, repor: repor ? '1' : null, ...mudar }
    for (const [k, v] of Object.entries(atual)) if (v) p.set(k, v)
    const texto = p.toString()
    return texto ? `/estoque?${texto}` : '/estoque'
  }
  const registrar = (tipo: string, id: string) => `${filtro({})}${filtro({}).includes('?') ? '&' : '?'}registrar=${tipo}&material=${id}`

  return (
    <div className={s.pagina}>
      <header className={s.topo}>
        <h1>Estoque</h1>
        <Link href={`${filtro({})}${filtro({}).includes('?') ? '&' : '?'}registrar=material`} className="botao botao-principal" scroll={false}>
          <Plus weight="bold" aria-hidden />
          Cadastrar material
        </Link>
      </header>

      <form action="/estoque" className={s.busca} role="search">
        {categoria && <input type="hidden" name="cat" value={categoria} />}
        {repor && <input type="hidden" name="repor" value="1" />}
        <MagnifyingGlass aria-hidden />
        <label htmlFor="busca" className="sr-only">
          Procurar pedra ou material
        </label>
        <input id="busca" name="q" className="entrada" defaultValue={busca} placeholder="Procurar pedra ou material..." autoComplete="off" />
        <button type="submit" className="botao">
          Procurar
        </button>
      </form>

      <dl className={s.resumo}>
        <div>
          <dt>Materiais</dt>
          <dd>{todos.length}</dd>
        </div>
        <div>
          <dt>Em estoque (pelo preço de compra)</dt>
          <dd>{reais(valorTotal)}</dd>
        </div>
        <div data-alerta={qtdRepor > 0 || undefined}>
          <dt>Precisam de reposição</dt>
          <dd>
            {qtdRepor > 0 && <Warning weight="bold" aria-hidden />}
            {qtdRepor}
          </dd>
        </div>
      </dl>

      <nav className={s.filtros} aria-label="Filtrar">
        <Link href={filtro({ cat: null, repor: null })} aria-current={!categoria && !repor ? 'true' : undefined}>
          Todos ({todos.length})
        </Link>
        {categoriasUsadas.map((c) => (
          <Link key={c} href={filtro({ cat: c, repor: null })} aria-current={categoria === c ? 'true' : undefined}>
            {PLURAL[c]}
          </Link>
        ))}
        {qtdRepor > 0 && (
          <Link
            href={filtro({ repor: repor ? null : '1', cat: null })}
            aria-current={repor ? 'true' : undefined}
            className={s.filtroRepor}
          >
            Precisa repor ({qtdRepor})
          </Link>
        )}
      </nav>

      {todos.length === 0 ? (
        <div className={`cartao ${s.vazio}`}>
          <h2>Nenhum material cadastrado ainda</h2>
          <p>Cadastre as pedras e materiais que tem no pátio. O que já está lá entra como estoque inicial, sem mexer no caixa.</p>
          <Link href="/estoque?registrar=material" className="botao botao-principal" scroll={false}>
            <Plus weight="bold" aria-hidden />
            Cadastrar o primeiro material
          </Link>
        </div>
      ) : lista.length === 0 ? (
        <div className={`cartao ${s.vazio}`}>
          <h2>Nada encontrado</h2>
          <p>{busca ? `Nenhuma pedra com "${busca}".` : 'Nenhum material nesse filtro.'}</p>
          <Link href="/estoque" className="botao">
            Ver todos
          </Link>
        </div>
      ) : (
        <div className={`cartao ${s.tabelaCaixa}`}>
          <table className={s.tabela}>
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Custo médio</th>
                <th scope="col">Investido</th>
                <th scope="col">Situação</th>
                <th scope="col">
                  <span className="sr-only">Registrar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => {
                const baixo = precisaRepor(m)
                const nivel = m.estoque_minimo > 0 ? Math.min(1, m.quantidade / (m.estoque_minimo * 2)) : 1
                return (
                  <tr key={m.id}>
                    <th scope="row">
                      <Link href={`/estoque/${m.id}`} className={s.material}>
                        <Miniatura foto={m.foto} categoria={m.categoria} />
                        <span>
                          <strong>{m.nome}</strong>
                          <small>
                            {m.categoria}
                            {m.fornecedor ? `, ${m.fornecedor}` : ''}
                          </small>
                        </span>
                      </Link>
                    </th>
                    <td>
                      <span className={s.quantidade} data-baixo={baixo || undefined}>
                        {numeroBR(m.quantidade)} <span>{nomeUnidade(m.unidade, m.quantidade)}</span>
                      </span>
                      {m.estoque_minimo > 0 && (
                        <span className={s.nivel} data-baixo={baixo || undefined}>
                          <span style={{ width: `${Math.max(4, nivel * 100)}%` }} />
                        </span>
                      )}
                      <small className={s.minimo}>
                        {m.estoque_minimo > 0 ? `mínimo ${qtd(m.estoque_minimo, m.unidade)}` : 'sem mínimo'}
                      </small>
                    </td>
                    <td>
                      <span className={s.dinheiro}>{reais(m.custo_medio)}</span>
                      <small className={s.minimo}>por {nomeUnidade(m.unidade, 1)}</small>
                    </td>
                    <td>
                      <span className={s.dinheiro}>{reais(Math.round(m.quantidade * m.custo_medio * 100) / 100)}</span>
                    </td>
                    <td>
                      {m.quantidade <= 0 ? (
                        <span className="etiqueta etiqueta-ambar">Sem estoque</span>
                      ) : baixo ? (
                        <span className="etiqueta etiqueta-ambar">Precisa repor</span>
                      ) : (
                        <span className="etiqueta etiqueta-verde">Em dia</span>
                      )}
                    </td>
                    <td>
                      <span className={s.acoes}>
                        <Link href={registrar('compra', m.id)} className="botao botao-pequeno" scroll={false}>
                          <ArrowUp weight="bold" aria-hidden />
                          Entrada
                        </Link>
                        <Link href={registrar('saida', m.id)} className="botao botao-pequeno" scroll={false}>
                          <ArrowDown weight="bold" aria-hidden />
                          Saída
                        </Link>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className={s.rodape}>
            Mostrando {lista.length} de {todos.length} {todos.length === 1 ? 'material' : 'materiais'}
          </p>
        </div>
      )}
    </div>
  )
}
