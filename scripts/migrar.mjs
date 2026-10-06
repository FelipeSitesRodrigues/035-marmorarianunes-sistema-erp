/*
 * Aplica as migrações de db/migracoes no banco, uma vez cada, em ordem.
 *
 *   node --env-file=.env.local scripts/migrar.mjs
 *
 * Usa ADMIN_DATABASE_URL (dono do banco: cria schema, função e permissão).
 * O sistema em si conecta com DATABASE_URL, o usuário nunes_app, que só
 * lê e grava dentro do schema nunes.
 */
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import postgres from 'postgres'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pasta = path.join(raiz, 'db', 'migracoes')

export async function migrar(url, { silencioso = false } = {}) {
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
  const log = (...a) => !silencioso && console.log(...a)
  try {
    await sql`create schema if not exists nunes`
    await sql`create table if not exists nunes._migracoes (nome text primary key, aplicada_em timestamptz not null default now())`
    const feitas = new Set((await sql`select nome from nunes._migracoes`).map((l) => l.nome))
    const arquivos = (await readdir(pasta)).filter((a) => a.endsWith('.sql')).sort()

    for (const nome of arquivos) {
      if (feitas.has(nome)) continue
      const texto = await readFile(path.join(pasta, nome), 'utf8')
      await sql.begin(async (tx) => {
        await tx.unsafe(texto)
        await tx`insert into nunes._migracoes (nome) values (${nome})`
      })
      log(`aplicada: ${nome}`)
    }

    // Permissões do usuário do sistema, refeitas a cada rodada (idempotente)
    const [{ existe }] = await sql`select exists (select 1 from pg_roles where rolname = 'nunes_app') as existe`
    if (existe) {
      await sql.unsafe(await readFile(path.join(raiz, 'db', 'permissoes.sql'), 'utf8'))
      log('permissões do nunes_app conferidas')
    } else {
      log('aviso: o usuário nunes_app ainda não existe (scripts/criar-usuario-banco.mjs)')
    }
  } finally {
    await sql.end()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const url = process.env.ADMIN_DATABASE_URL
  if (!url) {
    console.error('Falta ADMIN_DATABASE_URL no ambiente.')
    process.exit(1)
  }
  migrar(url).catch((erro) => {
    console.error(erro.message)
    process.exit(1)
  })
}
