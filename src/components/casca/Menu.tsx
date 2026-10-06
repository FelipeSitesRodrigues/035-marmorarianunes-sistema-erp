'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar,
  ClockCounterClockwise,
  CurrencyCircleDollar,
  Cube,
  House,
  SignOut,
} from '@phosphor-icons/react'
import { sair } from '@/lib/acoes/entrar'
import { Marca } from './Marca'
import s from './casca.module.css'

export const ITENS_MENU = [
  { href: '/', rotulo: 'Início', Icone: House },
  { href: '/estoque', rotulo: 'Estoque', Icone: Cube },
  { href: '/financeiro', rotulo: 'Financeiro', Icone: CurrencyCircleDollar },
  { href: '/relatorios', rotulo: 'Relatórios', Icone: ChartBar },
  { href: '/historico', rotulo: 'Histórico', Icone: ClockCounterClockwise },
] as const

export const ativo = (caminho: string, href: string) => (href === '/' ? caminho === '/' : caminho.startsWith(href))

export function Menu({ nome }: { nome: string }) {
  const caminho = usePathname()

  return (
    <aside className={s.menu}>
      <Link href="/" className={s.menuMarca} aria-label="Marmoraria Nunes, início">
        <Marca />
      </Link>

      <nav aria-label="Menu principal" className={s.menuNav}>
        {ITENS_MENU.map(({ href, rotulo, Icone }) => {
          const atual = ativo(caminho, href)
          return (
            <Link key={href} href={href} className={s.menuItem} aria-current={atual ? 'page' : undefined}>
              <Icone weight={atual ? 'fill' : 'regular'} aria-hidden />
              {rotulo}
            </Link>
          )
        })}
      </nav>

      <div className={s.menuPe}>
        <div className={s.menuUsuario}>
          <span className={s.avatar} aria-hidden>
            {nome.trim()[0]?.toUpperCase() ?? 'V'}
          </span>
          {nome.split(' ')[0]}
        </div>
        <form action={sair}>
          <button type="submit" className={s.menuItem}>
            <SignOut aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
