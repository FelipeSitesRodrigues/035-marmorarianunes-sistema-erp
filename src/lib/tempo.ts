import { MESES } from './formatos'

/*
 * O relógio é o de Irecê, não o do servidor (a Vercel roda em UTC: uma venda
 * às 22h cairia no dia seguinte).
 */

const FUSO = 'America/Bahia'

export function hojeISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  )
}

export function horaAgora(): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: FUSO, hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
}

export function saudacao() {
  const h = horaAgora()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

export type Mes = {
  chave: string // 2026-10
  inicio: string // 2026-10-01
  fim: string // 2026-10-31
  nome: string // outubro
  titulo: string // Outubro de 2026
  anterior: string
  proximo: string
  atual: boolean
}

/** Mês pedido na URL (?mes=2026-10) ou o mês de hoje. */
export function mesDe(param?: string | string[] | null): Mes {
  const hoje = hojeISO()
  const texto = typeof param === 'string' && /^\d{4}-\d{2}$/.test(param) ? param : hoje.slice(0, 7)
  let [ano, mes] = texto.split('-').map(Number)
  if (mes < 1 || mes > 12) [ano, mes] = hoje.slice(0, 7).split('-').map(Number)
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  const anterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${doisDigitos(mes - 1)}`
  const proximo = mes === 12 ? `${ano + 1}-01` : `${ano}-${doisDigitos(mes + 1)}`
  const nome = MESES[mes - 1]
  return {
    chave: `${ano}-${doisDigitos(mes)}`,
    inicio: `${ano}-${doisDigitos(mes)}-01`,
    fim: `${ano}-${doisDigitos(mes)}-${doisDigitos(ultimo)}`,
    nome,
    titulo: `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`,
    anterior,
    proximo,
    atual: texto === hoje.slice(0, 7),
  }
}

/** Soma dias a uma data ISO */
export function somarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1, d + dias))
  return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}-${doisDigitos(data.getUTCDate())}`
}

export type Periodo = {
  tipo: 'dia' | 'semana' | 'mes'
  inicio: string
  fim: string
  titulo: string
  anterior: string // data de referência do período anterior
  proximo: string
  referencia: string
}

/** Período dos relatórios: dia, semana (segunda a domingo) ou mês. */
export function periodoDe(tipo: string | undefined, data: string | undefined): Periodo {
  const t = tipo === 'dia' || tipo === 'semana' ? tipo : 'mes'
  const ref = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hojeISO()
  const [a, m, d] = ref.split('-').map(Number)

  if (t === 'dia') {
    const dia = Number(d)
    return {
      tipo: t,
      inicio: ref,
      fim: ref,
      titulo: `${dia} de ${MESES[m - 1]} de ${a}`,
      anterior: somarDias(ref, -1),
      proximo: somarDias(ref, 1),
      referencia: ref,
    }
  }
  if (t === 'semana') {
    const semana = new Date(Date.UTC(a, m - 1, d)).getUTCDay()
    const inicio = somarDias(ref, -((semana + 6) % 7))
    const fim = somarDias(inicio, 6)
    const [, mi, di] = inicio.split('-').map(Number)
    const [af, mf, df] = fim.split('-').map(Number)
    return {
      tipo: t,
      inicio,
      fim,
      titulo:
        mi === mf
          ? `${di} a ${df} de ${MESES[mf - 1]} de ${af}`
          : `${di} de ${MESES[mi - 1]} a ${df} de ${MESES[mf - 1]} de ${af}`,
      anterior: somarDias(inicio, -7),
      proximo: somarDias(inicio, 7),
      referencia: ref,
    }
  }
  const mes = mesDe(`${a}-${doisDigitos(m)}`)
  return {
    tipo: 'mes',
    inicio: mes.inicio,
    fim: mes.fim,
    titulo: mes.titulo,
    anterior: `${mes.anterior}-01`,
    proximo: `${mes.proximo}-01`,
    referencia: ref,
  }
}
