import 'server-only'
import postgres from 'postgres'

/*
 * Conexão com o banco, só no servidor.
 *
 * O usuário nunes_app enxerga só o schema "nunes" (search_path e fuso de
 * Irecê vêm da configuração do próprio usuário no banco). prepare: false
 * porque em produção a conexão passa pelo pooler do Supabase.
 *
 * Valores numéricos chegam como number (dinheiro tem 2 casas, quantidade 3:
 * cabe com folga) e datas como texto "AAAA-MM-DD", pra não virar Date em UTC
 * e mostrar o dia anterior.
 */

const globalDb = globalThis as unknown as { nunesSql?: postgres.Sql }

function conectar() {
  // Pooler do Supabase sempre no modo sessão (5432). No modo transação (6543)
  // consultas em paralelo na mesma conexão ficam presas no banco (ClientRead)
  // e a página nunca responde. Visto na Vercel em 2026-10-06.
  const url = process.env.DATABASE_URL?.replace('.pooler.supabase.com:6543/', '.pooler.supabase.com:5432/')
  if (!url) throw new Error('DATABASE_URL não configurada')
  return postgres(url, {
    prepare: false,
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
    types: {
      numeric: { to: 1700, from: [1700], serialize: (v: unknown) => String(v), parse: (v: string) => Number(v) },
      date: { to: 1082, from: [1082], serialize: (v: unknown) => String(v), parse: (v: string) => v },
    },
  })
}

export const sql = globalDb.nunesSql ?? conectar()
if (process.env.NODE_ENV !== 'production') globalDb.nunesSql = sql
