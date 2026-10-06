'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { sql } from '../db'
import { conferirSenha, gastarTempo } from '../senha'
import { criarSessao, encerrarSessao } from '../sessao'

/*
 * Entrar e sair.
 *
 * Tentativa errada fica registrada: 5 erros no mesmo e-mail ou 20 no mesmo
 * endereço de internet em 15 minutos seguram novas tentativas por 15 minutos.
 * A mensagem de erro é a mesma com ou sem o e-mail existir.
 */

export type EstadoEntrar = { erro: string | null; email?: string }

const ERRO = 'E-mail ou senha não conferem. Tente de novo.'

export async function entrar(_estado: EstadoEntrar, dados: FormData): Promise<EstadoEntrar> {
  const email = String(dados.get('email') ?? '').trim().toLowerCase().slice(0, 120)
  const senha = String(dados.get('senha') ?? '').slice(0, 200)
  if (!email || !senha) return { erro: 'Preencha o e-mail e a senha.', email }

  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sem-ip'
  const [limite] = await sql<{ por_email: number; por_ip: number }[]>`
    select count(*) filter (where chave = ${`email:${email}`})::int as por_email,
           count(*) filter (where chave = ${`ip:${ip}`})::int as por_ip
      from nunes.tentativas_login
     where criado_em > now() - interval '15 minutes'
  `
  if (limite.por_email >= 5 || limite.por_ip >= 20) {
    return { erro: 'Muitas tentativas seguidas. Espere 15 minutos e tente de novo.', email }
  }

  const [usuario] = await sql<{ id: string; senha_hash: string }[]>`
    select id, senha_hash from nunes.usuarios where email = ${email} and ativo
  `
  const confere = usuario ? await conferirSenha(senha, usuario.senha_hash) : (await gastarTempo(senha), false)

  if (!usuario || !confere) {
    await sql`insert into nunes.tentativas_login (chave) values (${`email:${email}`}), (${`ip:${ip}`})`
    await sql`delete from nunes.tentativas_login where criado_em < now() - interval '1 day'`
    return { erro: ERRO, email }
  }

  await sql`delete from nunes.tentativas_login where chave = ${`email:${email}`}`
  await sql`delete from nunes.sessoes where expira_em < now()`
  await criarSessao(usuario.id)
  redirect('/')
}

export async function sair() {
  await encerrarSessao()
  redirect('/entrar')
}
