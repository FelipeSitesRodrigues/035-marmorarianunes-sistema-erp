/*
 * Login do sistema (não tem "esqueci a senha": quem cria e troca é o Felipe).
 *
 *   node --env-file=.env.local scripts/acesso.mjs criar <email> <nome> [senha]
 *   node --env-file=.env.local scripts/acesso.mjs senha <email> [senha]
 *   node --env-file=.env.local scripts/acesso.mjs sair-de-tudo <email>
 *
 * Sem senha, gera uma de 12 caracteres fácil de ler e mostra na tela.
 * O hash é o mesmo de src/lib/senha.ts (scrypt).
 */
import { randomBytes, randomInt, scrypt } from 'node:crypto'
import postgres from 'postgres'

const [, , comando, emailBruto, ...resto] = process.argv
const url = process.env.DATABASE_URL
if (!url || !comando || !emailBruto) {
  console.log('uso: acesso.mjs criar <email> <nome> [senha] | senha <email> [senha] | sair-de-tudo <email>')
  process.exit(1)
}
const email = emailBruto.trim().toLowerCase()

function senhaNova() {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 12 }, () => letras[randomInt(letras.length)]).join('')
}

function hash(senha) {
  const sal = randomBytes(16)
  return new Promise((resolve, reject) =>
    scrypt(senha.normalize('NFKC'), sal, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, chave) =>
      e ? reject(e) : resolve(`scrypt$16384$8$1$${sal.toString('base64')}$${chave.toString('base64')}`),
    ),
  )
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
try {
  if (comando === 'criar') {
    const [nome, senhaDada] = resto
    if (!nome) throw new Error('Falta o nome.')
    const senha = senhaDada ?? senhaNova()
    if (senha.length < 10) throw new Error('A senha precisa de pelo menos 10 caracteres.')
    await sql`insert into nunes.usuarios (nome, email, senha_hash) values (${nome}, ${email}, ${await hash(senha)})`
    console.log(`Acesso criado: ${email}\nSenha: ${senha}`)
  } else if (comando === 'senha') {
    const senha = resto[0] ?? senhaNova()
    if (senha.length < 10) throw new Error('A senha precisa de pelo menos 10 caracteres.')
    const r = await sql`update nunes.usuarios set senha_hash = ${await hash(senha)} where email = ${email}`
    if (!r.count) throw new Error('E-mail não encontrado.')
    await sql`delete from nunes.sessoes where usuario_id = (select id from nunes.usuarios where email = ${email})`
    console.log(`Senha trocada: ${email}\nSenha: ${senha}\n(os aparelhos que estavam logados vão pedir a senha nova)`)
  } else if (comando === 'sair-de-tudo') {
    const r = await sql`delete from nunes.sessoes where usuario_id = (select id from nunes.usuarios where email = ${email})`
    console.log(`${r.count} sessão(ões) encerrada(s).`)
  } else {
    throw new Error(`Comando desconhecido: ${comando}`)
  }
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
