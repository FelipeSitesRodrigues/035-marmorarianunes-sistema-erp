import 'server-only'
import { revalidatePath } from 'next/cache'
import { exigirUsuario } from '../sessao'

/*
 * Toda ação passa por aqui: confere a sessão, roda, atualiza as telas e
 * transforma erro do banco em frase que a Val entende.
 *
 * As regras (estoque que não fica negativo, valor pago maior que o total...)
 * moram nas funções do banco, que já respondem em português (código P0001).
 * Qualquer outro erro vira uma frase genérica e fica no log da Vercel.
 */

type ErroBanco = { code?: string; message?: string }

export function mensagemDeErro(erro: unknown) {
  const e = erro as ErroBanco
  if (e?.code === 'P0001' && e.message) return e.message
  if (e?.code === '22P02' || e?.code === '22007' || e?.code === '22008' || e?.code === '22003') {
    return 'Algum campo ficou com um valor que não dá pra ler. Confira os números e as datas.'
  }
  if (e?.code === '23505') return 'Isso já estava salvo.'
  console.error('[acao]', erro)
  return 'Não deu pra salvar agora. Confira a internet e tente de novo.'
}

export async function executar<T>(
  trabalho: (usuarioId: string) => Promise<T>,
): Promise<{ ok: true; valor: T } | { ok: false; erro: string }> {
  const usuario = await exigirUsuario()
  try {
    const valor = await trabalho(usuario.id)
    revalidatePath('/', 'layout')
    return { ok: true, valor }
  } catch (erro) {
    return { ok: false, erro: mensagemDeErro(erro) }
  }
}

// ---------------------------------------------------------------------------
// Limpeza do que chega da tela: só os campos conhecidos, no tipo certo.
// O banco valida de novo, mas não recebe lixo.
// ---------------------------------------------------------------------------

export const texto = (v: unknown, max = 200) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined

export const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

export const data = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)

export const uuid = (v: unknown) =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : undefined

export function lista<T>(v: unknown, limpar: (item: Record<string, unknown>) => T, max = 20): T[] {
  return Array.isArray(v) ? v.slice(0, max).map((i) => limpar((i ?? {}) as Record<string, unknown>)) : []
}

export function pagamento(v: unknown) {
  const p = (v ?? {}) as Record<string, unknown>
  const modo = p.modo === 'parte' || p.modo === 'depois' ? p.modo : 'tudo'
  return {
    modo,
    valor_pago: numero(p.valor_pago),
    forma: texto(p.forma, 40),
    vencimento: data(p.vencimento),
  }
}
