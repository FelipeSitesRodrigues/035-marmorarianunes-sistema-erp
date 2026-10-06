/*
 * Copia todas as tabelas do schema nunes em JSON, uma por arquivo, na pasta
 * backup/. Usado pela Action diária (.github/workflows/backup.yml), que
 * criptografa a pasta. Conecta com o usuário só-leitura nunes_backup.
 *
 *   BACKUP_DATABASE_URL=... node scripts/backup.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import postgres from 'postgres'

const url = process.env.BACKUP_DATABASE_URL
if (!url) {
  console.error('Falta BACKUP_DATABASE_URL.')
  process.exit(1)
}

const TABELAS = ['usuarios', 'materiais', 'operacoes', 'movimentos', 'lancamentos', 'eventos', '_migracoes']

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
try {
  await mkdir('backup', { recursive: true })
  const resumo = {}
  for (const tabela of TABELAS) {
    const linhas = await sql`select * from ${sql(`nunes.${tabela}`)}`.catch(() => null)
    if (!linhas) continue
    await writeFile(`backup/${tabela}.json`, JSON.stringify(linhas, null, 1))
    resumo[tabela] = linhas.length
  }
  await writeFile('backup/resumo.json', JSON.stringify({ feito_em: new Date().toISOString(), linhas: resumo }, null, 2))
  console.log('Backup:', resumo)
} finally {
  await sql.end()
}
