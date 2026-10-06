import { NextResponse, type NextRequest } from 'next/server'

/*
 * Filtro rápido: sem o cookie de sessão, qualquer tela vai pra /entrar.
 * Não confere se a sessão vale (isso é no servidor, em exigirUsuario, em toda
 * página e toda ação). Aqui só evita desenhar uma tela pra quem nem entrou.
 */

const COOKIE_SESSAO = 'nunes_sessao'

export function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname
  const temCookie = request.cookies.has(COOKIE_SESSAO)

  if (!temCookie && caminho !== '/entrar') {
    return NextResponse.redirect(new URL('/entrar', request.url), 303)
  }

  const resposta = NextResponse.next()
  resposta.headers.set('Cache-Control', 'private, no-store')
  return resposta
}

export const config = {
  matcher: ['/((?!_next/|pedras/|textura/|marca/|icon.png|favicon.ico).*)'],
}
