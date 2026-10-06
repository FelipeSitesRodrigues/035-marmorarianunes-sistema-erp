'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { ArrowCounterClockwise, CheckCircle, Warning, X } from '@phosphor-icons/react'
import { cancelar } from '@/lib/acoes/lancamentos'
import s from './registro.module.css'

/*
 * Confirmação depois de salvar: diz o que mudou ("Verde Ubatuba agora tem 12
 * chapas"), fica 10 segundos e oferece Desfazer. Desfazer cancela o lançamento
 * (fica no histórico como cancelado, nada some).
 */

type Aviso = {
  id: number
  titulo: string
  linhas: string[]
  tom: 'ok' | 'erro'
  operacaoId?: string
  numero?: number
}

type Contexto = { avisar: (a: Omit<Aviso, 'id'>) => void }

const AvisoContexto = createContext<Contexto>({ avisar: () => {} })
export const useAviso = () => useContext(AvisoContexto)

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [desfazendo, startTransition] = useTransition()
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fechar = useCallback(() => setAviso(null), [])

  const agendar = useCallback((ms: number) => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setAviso(null), ms)
  }, [])

  const avisar = useCallback(
    (a: Omit<Aviso, 'id'>) => {
      setAviso({ ...a, id: Date.now() })
      agendar(a.tom === 'erro' ? 8000 : 10000)
    },
    [agendar],
  )

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current)
  }, [])

  function desfazer() {
    if (!aviso?.operacaoId) return
    const id = aviso.operacaoId
    startTransition(async () => {
      const r = await cancelar(id, 'Desfeito logo depois de salvar')
      if (r.ok) {
        setAviso({ id: Date.now(), titulo: 'Desfeito.', linhas: ['O estoque e o dinheiro voltaram como estavam.'], tom: 'ok' })
      } else {
        setAviso({ id: Date.now(), titulo: 'Não deu pra desfazer.', linhas: [r.erro], tom: 'erro' })
      }
      agendar(7000)
    })
  }

  return (
    <AvisoContexto.Provider value={{ avisar }}>
      {children}
      <div className={s.avisoArea} aria-live="polite" role="status">
        {aviso && (
          <div key={aviso.id} className={s.aviso} data-tom={aviso.tom} onMouseEnter={() => agendar(20000)}>
            <span className={s.avisoIcone} aria-hidden>
              {aviso.tom === 'ok' ? <CheckCircle weight="fill" /> : <Warning weight="fill" />}
            </span>
            <div className={s.avisoTexto}>
              <strong>{aviso.titulo}</strong>
              {aviso.linhas.map((l) => (
                <span key={l}>{l}</span>
              ))}
              {(aviso.operacaoId || aviso.numero) && (
                <div className={s.avisoAcoes}>
                  {aviso.operacaoId && (
                    <button type="button" className="botao botao-pequeno" onClick={desfazer} disabled={desfazendo}>
                      <ArrowCounterClockwise aria-hidden />
                      {desfazendo ? 'Desfazendo...' : 'Desfazer'}
                    </button>
                  )}
                  {aviso.numero && (
                    <Link href={`/historico/${aviso.numero}`} className="botao botao-pequeno" onClick={fechar}>
                      Ver lançamento
                    </Link>
                  )}
                </div>
              )}
            </div>
            <button type="button" className={s.avisoFechar} onClick={fechar} aria-label="Fechar aviso">
              <X aria-hidden />
            </button>
          </div>
        )}
      </div>
    </AvisoContexto.Provider>
  )
}
