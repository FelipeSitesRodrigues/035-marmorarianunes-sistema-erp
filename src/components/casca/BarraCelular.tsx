'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowsLeftRight,
  CurrencyCircleDollar,
  Cube,
  DotsThreeOutline,
  House,
  Plus,
  Receipt,
  ShoppingCart,
  Tag,
  X,
} from '@phosphor-icons/react'
import { ACOES } from '@/components/registro/acoes'
import { ativo } from './Menu'
import s from './casca.module.css'

const ICONES = { venda: Tag, compra: ShoppingCart, saida: ArrowsLeftRight, despesa: Receipt, material: Cube }

/*
 * Celular: barra fixa embaixo, no alcance do polegar. O botão do meio abre os
 * cinco registros num painel que sobe de baixo.
 */
export function BarraCelular() {
  const caminho = usePathname()
  const params = useSearchParams()
  const [aberto, setAberto] = useState(false)
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  const hrefAcao = (tipo: string) => {
    const p = new URLSearchParams(params.toString())
    p.delete('corrigir')
    p.set('registrar', tipo)
    return `${caminho}?${p.toString()}`
  }

  const item = (href: string, rotulo: string, Icone: typeof House) => {
    const atual = ativo(caminho, href)
    return (
      <Link href={href} className={s.barraItem} aria-current={atual ? 'page' : undefined}>
        <Icone weight={atual ? 'fill' : 'regular'} aria-hidden />
        {rotulo}
      </Link>
    )
  }

  return (
    <>
      <nav className={s.barra} aria-label="Menu">
        {item('/', 'Início', House)}
        {item('/estoque', 'Estoque', Cube)}
        <button type="button" className={s.barraRegistrar} onClick={() => setAberto(true)} aria-haspopup="dialog">
          <span className={s.barraMais} aria-hidden>
            <Plus weight="bold" />
          </span>
          Registrar
        </button>
        {item('/financeiro', 'Financeiro', CurrencyCircleDollar)}
        {item('/mais', 'Mais', DotsThreeOutline)}
      </nav>

      <dialog ref={dialogo} className={s.folha} onClose={() => setAberto(false)} aria-labelledby="folha-titulo">
        <div className={s.folhaTopo}>
          <h2 id="folha-titulo">O que você quer registrar?</h2>
          <button type="button" className={s.fechar} onClick={() => setAberto(false)} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <ul className={s.folhaLista}>
          {ACOES.map(({ tipo, titulo, explicacao }) => {
            const Icone = ICONES[tipo]
            return (
            <li key={tipo}>
              <Link href={hrefAcao(tipo)} className={s.folhaAcao} scroll={false} onClick={() => setAberto(false)}>
                <span className="selo">
                  <Icone aria-hidden />
                </span>
                <span>
                  <strong>{titulo}</strong>
                  <small>{explicacao}</small>
                </span>
              </Link>
            </li>
            )
          })}
        </ul>
      </dialog>
    </>
  )
}
