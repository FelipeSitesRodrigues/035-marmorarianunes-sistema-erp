/*
 * Cria, no banco de produção, os dois usuários que a Nunes usa:
 *   nunes_app     o sistema (lê e grava só no schema nunes)
 *   nunes_backup  o backup diário (só lê)
 * com senha aleatória, e mostra os endereços de conexão.
 *
 *   ADMIN_DATABASE_URL=... SUPABASE_REF=... node scripts/criar-usuario-banco.mjs
 *
 * ADMIN_DATABASE_URL é a conexão do dono do banco (postgres) do projeto do
 * Supabase. Rodar uma vez só; depois, scripts/migrar.mjs cria as tabelas e
 * as permissões. Usuário que já existe não é mexido (a senha não muda).
 */
import { randomBytes } from 'node:crypto'
import postgres from 'postgres'

const url = process.env.ADMIN_DATABASE_URL
const ref = process.env.SUPABASE_REF ?? '<ref-do-projeto>'
if (!url) {
  console.error('Falta ADMIN_DATABASE_URL.')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
try {
  for (const nome of ['nunes_app', 'nunes_backup']) {
    const [{ existe }] = await sql`select exists (select 1 from pg_roles where rolname = ${nome}) as existe`
    if (existe) {
      console.log(`${nome}: já existe, senha mantida`)
      continue
    }
    const senha = randomBytes(24).toString('base64url')
    await sql.unsafe(`create role ${nome} login password '${senha}'`)
    console.log(`\n${nome} criado. Endereço (pooler do Supabase, modo transação):`)
    console.log(`postgresql://${nome}.${ref}:${senha}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`)
  }
  console.log('\nAgora: ADMIN_DATABASE_URL=... node scripts/migrar.mjs')
} finally {
  await sql.end()
}
