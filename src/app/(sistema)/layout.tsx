import { Suspense } from 'react'
import Link from 'next/link'
import { BarraCelular } from '@/components/casca/BarraCelular'
import { Marca } from '@/components/casca/Marca'
import { Menu } from '@/components/casca/Menu'
import s from '@/components/casca/casca.module.css'
import { AvisoProvider } from '@/components/registro/Aviso'
import { Gaveta } from '@/components/registro/Gaveta'
import { contatosConhecidos, materiaisAtivos } from '@/lib/consultas/comum'
import { exigirUsuario } from '@/lib/sessao'
import { hojeISO } from '@/lib/tempo'

/*
 * Casca de quem entrou. Os formulários de registro moram aqui (Gaveta), por
 * cima de qualquer tela: a Val registra uma venda sem sair de onde está.
 * Toda página e toda ação conferem a sessão de novo (exigirUsuario).
 */
export default async function LayoutSistema({ children }: LayoutProps<'/'>) {
  const usuario = await exigirUsuario()
  const [materiais, contatos] = await Promise.all([materiaisAtivos(), contatosConhecidos()])

  return (
    <AvisoProvider>
      <div className={s.casca}>
        <Menu nome={usuario.nome} />
        <div>
          <header className={s.topoCelular}>
            <Link href="/" aria-label="Marmoraria Nunes, início">
              <Marca compacta />
            </Link>
          </header>
          <main className={s.trabalho}>{children}</main>
        </div>
        <Suspense>
          <BarraCelular />
        </Suspense>
      </div>
      <Suspense>
        <Gaveta materiais={materiais} contatos={contatos} hoje={hojeISO()} />
      </Suspense>
    </AvisoProvider>
  )
}
