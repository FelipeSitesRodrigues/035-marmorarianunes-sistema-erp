'use client'

import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, MagnifyingGlass, Minus, Plus, Package, Warning, Wrench } from '@phosphor-icons/react'
import { lerNumero, nomeUnidade, numeroBR, qtd, valorCampo, type Unidade } from '@/lib/formatos'
import type { MaterialOpcao } from '@/lib/tipos'
import s from './registro.module.css'

/* Peças dos formulários: pergunta, opções grandes, dinheiro, quantidade e pedra. */

export function Pergunta({
  rotulo,
  htmlFor,
  ajuda,
  erro,
  opcional,
  children,
}: {
  rotulo: string
  htmlFor?: string
  ajuda?: ReactNode
  erro?: string | null
  opcional?: boolean
  children: ReactNode
}) {
  return (
    <div className={s.pergunta}>
      <label className={s.rotulo} htmlFor={htmlFor}>
        {rotulo}
        {opcional && <span className={s.opcional}> (opcional)</span>}
      </label>
      {children}
      {erro ? (
        <p className={s.erroCampo}>
          <Warning weight="fill" aria-hidden />
          {erro}
        </p>
      ) : (
        ajuda && <p className={s.ajuda}>{ajuda}</p>
      )}
    </div>
  )
}

export function Grupo({
  legenda,
  ajuda,
  erro,
  children,
}: {
  legenda: string
  ajuda?: ReactNode
  erro?: string | null
  children: ReactNode
}) {
  return (
    <fieldset className={s.pergunta}>
      <legend className={s.rotulo}>{legenda}</legend>
      {children}
      {erro ? (
        <p className={s.erroCampo}>
          <Warning weight="fill" aria-hidden />
          {erro}
        </p>
      ) : (
        ajuda && <p className={s.ajuda}>{ajuda}</p>
      )}
    </fieldset>
  )
}

/** Opções grandes, uma ao lado da outra (ou empilhadas no celular). */
export function Opcoes<T extends string>({
  nome,
  valor,
  onChange,
  opcoes,
  colunas = 3,
}: {
  nome: string
  valor: T | null
  onChange: (v: T) => void
  opcoes: { valor: T; titulo: string; descricao?: string }[]
  colunas?: number
}) {
  return (
    <div className={s.opcoes} style={{ '--colunas': colunas } as React.CSSProperties}>
      {opcoes.map((o) => (
        <label key={o.valor} className={s.opcao} data-marcada={valor === o.valor || undefined}>
          <input
            type="radio"
            name={nome}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => onChange(o.valor)}
            className="sr-only"
          />
          <span className={s.opcaoMarca} aria-hidden>
            <Check weight="bold" />
          </span>
          <span className={s.opcaoTitulo}>{o.titulo}</span>
          {o.descricao && <span className={s.opcaoDescricao}>{o.descricao}</span>}
        </label>
      ))}
    </div>
  )
}

/** Fichas pequenas: forma de pagamento, tipo de despesa, unidade. */
export function Fichas<T extends string>({
  nome,
  valor,
  onChange,
  opcoes,
}: {
  nome: string
  valor: T | null
  onChange: (v: T) => void
  opcoes: readonly T[] | { valor: T; rotulo: string }[]
}) {
  const lista = (opcoes as (T | { valor: T; rotulo: string })[]).map((o) =>
    typeof o === 'string' ? { valor: o, rotulo: o } : o,
  )
  return (
    <div className={s.fichas}>
      {lista.map((o) => (
        <label key={o.valor} className={s.ficha} data-marcada={valor === o.valor || undefined}>
          <input
            type="radio"
            name={nome}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => onChange(o.valor)}
            className="sr-only"
          />
          {o.rotulo}
        </label>
      ))}
    </div>
  )
}

export function CampoDinheiro({
  id,
  valor,
  onChange,
  invalido,
  grande,
}: {
  id: string
  valor: string
  onChange: (v: string) => void
  invalido?: boolean
  grande?: boolean
}) {
  return (
    <div className={s.dinheiro} data-grande={grande || undefined}>
      <span aria-hidden>R$</span>
      <input
        id={id}
        className="entrada"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={valor}
        aria-invalid={invalido || undefined}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        onFocus={(e) => e.target.select()}
        onBlur={() => {
          const n = lerNumero(valor)
          if (n !== null) onChange(valorCampo(n))
        }}
      />
    </div>
  )
}

export function Quantidade({
  id,
  valor,
  onChange,
  unidade,
  invalido,
  rotulo = 'Quantidade',
}: {
  id: string
  valor: string
  onChange: (v: string) => void
  unidade?: Unidade
  invalido?: boolean
  rotulo?: string
}) {
  const n = lerNumero(valor) ?? 0
  const mudar = (passo: number) => onChange(numeroBR(Math.max(0, Math.round((n + passo) * 1000) / 1000)))
  return (
    <div className={s.quantidade}>
      <button type="button" onClick={() => mudar(-1)} aria-label="Menos um" disabled={n <= 0}>
        <Minus weight="bold" aria-hidden />
      </button>
      <input
        id={id}
        className="entrada"
        inputMode="decimal"
        autoComplete="off"
        value={valor}
        aria-label={rotulo}
        aria-invalid={invalido || undefined}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" onClick={() => mudar(1)} aria-label="Mais um">
        <Plus weight="bold" aria-hidden />
      </button>
      {unidade && <span className={s.unidade}>{nomeUnidade(unidade, n || 2)}</span>}
    </div>
  )
}

export function CampoTexto({
  id,
  valor,
  onChange,
  sugestoes,
  placeholder,
  invalido,
  maxLength = 120,
}: {
  id: string
  valor: string
  onChange: (v: string) => void
  sugestoes?: string[]
  placeholder?: string
  invalido?: boolean
  maxLength?: number
}) {
  const lista = useId()
  return (
    <>
      <input
        id={id}
        className="entrada"
        value={valor}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        list={sugestoes?.length ? lista : undefined}
        aria-invalid={invalido || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {sugestoes?.length ? (
        <datalist id={lista}>
          {sugestoes.slice(0, 60).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      ) : null}
    </>
  )
}

export function Miniatura({ foto, categoria, tamanho = 56 }: { foto: string | null; categoria?: string; tamanho?: number }) {
  if (!foto) {
    return (
      <span className="pedra pedra-icone" style={{ width: tamanho, height: tamanho }} aria-hidden>
        {categoria === 'Insumo' ? <Wrench /> : <Package />}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/pedras/${foto}.webp`} alt="" width={tamanho} height={tamanho} className="pedra" loading="lazy" />
  )
}

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function situacaoEstoque(m: MaterialOpcao) {
  if (m.quantidade <= 0) return { texto: 'Sem estoque', tom: 'ambar' as const }
  if (m.estoque_minimo > 0 && m.quantidade <= m.estoque_minimo)
    return { texto: `Disponível: ${qtd(m.quantidade, m.unidade)} (está no mínimo)`, tom: 'ambar' as const }
  return { texto: `Disponível: ${qtd(m.quantidade, m.unidade)}`, tom: 'verde' as const }
}

/** Escolha da pedra: botão com a foto; ao clicar, abre a busca ali mesmo. */
export function EscolhaMaterial({
  id,
  materiais,
  valor,
  onChange,
  invalido,
}: {
  id: string
  materiais: MaterialOpcao[]
  valor: string | null
  onChange: (id: string) => void
  invalido?: boolean
}) {
  const selecionado = materiais.find((m) => m.id === valor) ?? null
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const caixa = useRef<HTMLDivElement>(null)

  const lista = useMemo(() => {
    const termo = semAcento(busca.trim())
    return termo ? materiais.filter((m) => semAcento(m.nome).includes(termo)) : materiais
  }, [busca, materiais])

  function escolher(m: MaterialOpcao) {
    onChange(m.id)
    setAberto(false)
    setBusca('')
    requestAnimationFrame(() => document.getElementById(id)?.focus())
  }

  if (!aberto) {
    if (!selecionado) {
      return (
        <button
          type="button"
          id={id}
          className={s.materialVazio}
          data-invalido={invalido || undefined}
          onClick={() => setAberto(true)}
        >
          <MagnifyingGlass aria-hidden />
          Escolher pedra ou material
        </button>
      )
    }
    const sit = situacaoEstoque(selecionado)
    return (
      <button type="button" id={id} className={s.material} data-invalido={invalido || undefined} onClick={() => setAberto(true)}>
        <Miniatura foto={selecionado.foto} categoria={selecionado.categoria} tamanho={52} />
        <span className={s.materialTexto}>
          <strong>{selecionado.nome}</strong>
          <span className={`etiqueta etiqueta-${sit.tom}`}>{sit.texto}</span>
        </span>
        <span className={s.trocar}>Trocar</span>
      </button>
    )
  }

  return (
    <div
      className={s.busca}
      ref={caixa}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          e.preventDefault()
          setAberto(false)
        }
      }}
    >
      <div className={s.buscaCampo}>
        <MagnifyingGlass aria-hidden />
        <input
          id={id}
          className="entrada"
          autoFocus
          autoComplete="off"
          placeholder="Digite o nome da pedra"
          value={busca}
          aria-label="Procurar pedra ou material"
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (lista[0]) escolher(lista[0])
            }
          }}
        />
      </div>
      <ul className={s.buscaLista} aria-label="Materiais">
        {lista.map((m) => (
          <li key={m.id}>
            <button type="button" className={s.buscaOpcao} onClick={() => escolher(m)} aria-pressed={m.id === valor}>
              <Miniatura foto={m.foto} categoria={m.categoria} tamanho={44} />
              <span>
                <strong>{m.nome}</strong>
                <small data-pouco={m.quantidade <= m.estoque_minimo || undefined}>
                  {m.quantidade > 0 ? qtd(m.quantidade, m.unidade) : 'Sem estoque'}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {lista.length === 0 && (
        <p className={s.buscaVazia}>
          Nenhum material com esse nome. Se é uma pedra nova, cadastre primeiro em <strong>Cadastrar material</strong>.
        </p>
      )}
      {selecionado && (
        <button type="button" className={s.buscaVoltar} onClick={() => setAberto(false)}>
          Manter {selecionado.nome}
        </button>
      )}
    </div>
  )
}

export function Resumo({ tom = 'neutro', children }: { tom?: 'verde' | 'ambar' | 'neutro'; children: ReactNode }) {
  return (
    <div className={s.resumo} data-tom={tom}>
      {children}
    </div>
  )
}
