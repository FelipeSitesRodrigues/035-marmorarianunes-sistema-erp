import Link from 'next/link'
import { CaretRight, ChartBar, ClockCounterClockwise, Cube, CurrencyCircleDollar, SignOut } from '@phosphor-icons/react/dist/ssr'
import { sair } from '@/lib/acoes/entrar'
import { exigirUsuario } from '@/lib/sessao'
import s from './mais.module.css'

export const metadata = { title: 'Mais' }

/** O resto do menu, no celular (a barra de baixo só cabe cinco). */
export default async function Mais() {
  const usuario = await exigirUsuario()
  const itens = [
    { href: '/relatorios', rotulo: 'Relatórios', texto: 'Dia, semana e mês', Icone: ChartBar },
    { href: '/historico', rotulo: 'Histórico', texto: 'Tudo o que foi registrado', Icone: ClockCounterClockwise },
    { href: '/estoque', rotulo: 'Estoque', texto: 'Pedras e materiais', Icone: Cube },
    { href: '/financeiro', rotulo: 'Financeiro', texto: 'A receber, a pagar e o mês', Icone: CurrencyCircleDollar },
  ]
  return (
    <div className={s.pagina}>
      <h1>Mais</h1>
      <ul className={`cartao ${s.lista}`}>
        {itens.map(({ href, rotulo, texto, Icone }) => (
          <li key={href}>
            <Link href={href}>
              <span className="selo">
                <Icone aria-hidden />
              </span>
              <span>
                <strong>{rotulo}</strong>
                <small>{texto}</small>
              </span>
              <CaretRight weight="bold" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <form action={sair}>
        <button type="submit" className="botao botao-largo">
          <SignOut aria-hidden />
          Sair ({usuario.nome})
        </button>
      </form>
    </div>
  )
}
