/*
 * Postgres de verdade rodando na máquina, pra desenvolver sem tocar no banco
 * de produção. Sobe na porta 5435, cria o banco "nunes" e o usuário
 * nunes_app (como em produção) e aplica as migrações.
 *
 *   npm run db            (deixa rodando; Ctrl+C para)
 *   npm run db -- --demo  (também enche o banco com dados de demonstração)
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'
import postgres from 'postgres'
import { migrar } from './migrar.mjs'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pastaDados = path.join(raiz, '.db-local')
export const PORTA = 5435
export const ADMIN = (banco) => `postgres://postgres:postgres@localhost:${PORTA}/${banco}`

export async function subirBanco() {
  const pg = new EmbeddedPostgres({
    databaseDir: pastaDados,
    user: 'postgres',
    password: 'postgres',
    port: PORTA,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
  })
  if (!existsSync(path.join(pastaDados, 'PG_VERSION'))) await pg.initialise()
  await pg.start()
  return pg
}

export async function prepararBanco(banco, { recriar = false } = {}) {
  const admin = postgres(ADMIN('postgres'), { max: 1, onnotice: () => {} })
  try {
    if (recriar) await admin.unsafe(`drop database if exists ${banco} with (force)`)
    const [{ existe }] = await admin`select exists (select 1 from pg_database where datname = ${banco}) as existe`
    if (!existe) await admin.unsafe(`create database ${banco}`)
    await admin.unsafe(`do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'nunes_app') then
        create role nunes_app login password 'nunes-local';
      end if;
    end $$`)
  } finally {
    await admin.end()
  }
  await migrar(ADMIN(banco), { silencioso: true })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const pg = await subirBanco()
  await prepararBanco('nunes')
  if (process.argv.includes('--demo')) {
    const { semearDemo } = await import('./semear-demo.mjs')
    await semearDemo(`postgres://nunes_app:nunes-local@localhost:${PORTA}/nunes`)
  }
  console.log(`Postgres local no ar: postgres://nunes_app:nunes-local@localhost:${PORTA}/nunes`)
  const parar = async () => {
    await pg.stop()
    process.exit(0)
  }
  process.on('SIGINT', parar)
  process.on('SIGTERM', parar)
  setInterval(() => {}, 1 << 30)
}
