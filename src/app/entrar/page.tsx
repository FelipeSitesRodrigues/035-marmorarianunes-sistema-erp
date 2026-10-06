import { redirect } from 'next/navigation'
import { Marca } from '@/components/casca/Marca'
import { usuarioAtual } from '@/lib/sessao'
import { FormEntrar } from './FormEntrar'
import s from './entrar.module.css'

export const metadata = { title: 'Entrar' }

export default async function Entrar() {
  if (await usuarioAtual()) redirect('/')

  return (
    <main className={s.pagina}>
      <div className={s.caixa}>
        <div className={s.marca}>
          <Marca />
        </div>
        <div className={s.cartao}>
          <h1>Entrar</h1>
          <p className={s.texto}>Estoque e financeiro da loja.</p>
          <FormEntrar />
        </div>
      </div>
    </main>
  )
}
