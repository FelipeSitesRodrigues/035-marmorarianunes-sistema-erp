import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'node:crypto'
import { sql } from './db'
import { LOGIN_DESLIGADO } from './login-desligado'

/*
 * Sessão da Val.
 *
 * O cookie leva um token aleatório; o banco guarda só o hash dele, com a
 * validade. Quem manda é o banco: a sessão vale 30 dias e renova sozinha
 * enquanto a Val usa (o computador da loja não pede senha toda semana). Sair
 * apaga a linha, e o token deixa de valer em qualquer aparelho que tenha cópia.
 */

export const COOKIE_SESSAO = 'nunes_sessao'
const DIAS = 30

const hashDe = (token: string) => createHash('sha256').update(token).digest('hex')

export type Usuario = { id: string; nome: string; email: string }

export async function criarSessao(usuarioId: string) {
  const token = randomBytes(32).toString('base64url')
  await sql`
    insert into nunes.sessoes (token_hash, usuario_id, expira_em)
    values (${hashDe(token)}, ${usuarioId}, now() + ${`${DIAS} days`}::interval)
  `
  const loja = await cookies()
  loja.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 400 * 24 * 60 * 60,
  })
}

/** Quem está logado neste request, ou null. Uma consulta por request (cache). */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  if (LOGIN_DESLIGADO) {
    const [primeira] = await sql<Usuario[]>`
      select id, nome, email from nunes.usuarios where ativo order by criado_em limit 1
    `
    return primeira ?? null
  }
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  if (!token) return null
  const hash = hashDe(token)
  const [linha] = await sql<(Usuario & { renovar: boolean })[]>`
    select u.id, u.nome, u.email, s.expira_em < now() + interval '29 days' as renovar
      from nunes.sessoes s
      join nunes.usuarios u on u.id = s.usuario_id
     where s.token_hash = ${hash} and s.expira_em > now() and u.ativo
  `
  if (!linha) return null
  if (linha.renovar) {
    await sql`update nunes.sessoes set expira_em = now() + ${`${DIAS} days`}::interval where token_hash = ${hash}`
  }
  return { id: linha.id, nome: linha.nome, email: linha.email }
})

/** Porta de toda página e toda ação: sem sessão válida, volta pra tela de entrar. */
export async function exigirUsuario() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/entrar')
  return usuario
}

export async function encerrarSessao() {
  const loja = await cookies()
  const token = loja.get(COOKIE_SESSAO)?.value
  if (token) await sql`delete from nunes.sessoes where token_hash = ${hashDe(token)}`
  loja.delete(COOKIE_SESSAO)
}
