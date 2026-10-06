import Link from 'next/link'
import { ArrowsLeftRight, Cube, Receipt, Scales, ShoppingCart, Tag } from '@phosphor-icons/react/dist/ssr'
import { diaRelativo } from '@/lib/formatos'
import type { OperacaoLinha } from '@/lib/tipos'
import { descricao, rotuloTipo, situacao, valorDaLinha } from './descrever'
import s from './listas.module.css'

const ICONES = { venda: Tag, compra: ShoppingCart, saida: ArrowsLeftRight, despesa: Receipt, cadastro: Cube, ajuste: Scales }

const hora = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

/** Uma movimentação numa lista. A linha inteira leva ao detalhe no histórico. */
export function LinhaOperacao({ op, hoje, comHora }: { op: OperacaoLinha; hoje: string; comHora?: boolean }) {
  const tipo = rotuloTipo(op)
  const sit = situacao(op, hoje)
  const valor = valorDaLinha(op)
  const Icone = ICONES[op.tipo]
  const dia = diaRelativo(op.data, hoje)
  const riscada = op.situacao !== 'ativa'

  return (
    <li>
      <Link href={`/historico/${op.numero}`} className={s.linha} data-riscada={riscada || undefined}>
        <span className={`etiqueta etiqueta-${tipo.tom} ${s.tipo}`}>
          <Icone aria-hidden />
          {tipo.texto}
        </span>
        <span className={s.quando}>
          {dia}
          {comHora && dia === 'Hoje' ? `, ${hora(op.criado_em)}` : ''}
        </span>
        <span className={s.descricao}>{descricao(op)}</span>
        <span className={s.valor} data-vazio={!valor || undefined}>
          {valor ?? 'sem valor'}
        </span>
        <span className={s.situacao}>
          <span className={`etiqueta etiqueta-${sit.tom}`}>{sit.texto}</span>
        </span>
      </Link>
    </li>
  )
}
