import Link from 'next/link'
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import type { Mes } from '@/lib/tempo'
import s from './listas.module.css'

/** ‹ Outubro de 2026 › — links, então funciona sem esperar o navegador carregar nada. */
export function SeletorMes({ mes, caminho, extra = {} }: { mes: Mes; caminho: string; extra?: Record<string, string> }) {
  const href = (chave: string) => {
    const p = new URLSearchParams({ ...extra, mes: chave })
    return `${caminho}?${p.toString()}`
  }
  return (
    <nav className={s.seletor} aria-label="Escolher o mês">
      <Link href={href(mes.anterior)} aria-label="Mês anterior" scroll={false}>
        <CaretLeft weight="bold" aria-hidden />
      </Link>
      <span aria-live="polite">{mes.titulo}</span>
      <Link href={href(mes.proximo)} aria-label="Próximo mês" scroll={false}>
        <CaretRight weight="bold" aria-hidden />
      </Link>
    </nav>
  )
}
