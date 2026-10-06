import 'server-only'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

/*
 * Senha com scrypt, do próprio Node (sem dependência). O mesmo formato é
 * gerado por scripts/acesso.mjs, que cria o login da Val e troca a senha.
 *   scrypt$N$r$p$sal$hash
 */

const N = 16384
const R = 8
const P = 1
const TAMANHO = 64

function derivar(senha: string, sal: Buffer, n = N, r = R, p = P) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(senha.normalize('NFKC'), sal, TAMANHO, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (erro, chave) =>
      erro ? reject(erro) : resolve(chave),
    ),
  )
}

export async function gerarHash(senha: string) {
  const sal = randomBytes(16)
  const chave = await derivar(senha, sal)
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${chave.toString('base64')}`
}

export async function conferirSenha(senha: string, hash: string) {
  const [alg, n, r, p, sal, chave] = hash.split('$')
  if (alg !== 'scrypt' || !sal || !chave) return false
  const esperado = Buffer.from(chave, 'base64')
  const obtido = await derivar(senha, Buffer.from(sal, 'base64'), Number(n), Number(r), Number(p))
  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido)
}

/** Faz a mesma conta quando o e-mail não existe, pra resposta não entregar isso pelo tempo. */
export async function gastarTempo(senha: string) {
  await derivar(senha, randomBytes(16))
}
