'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Archive } from '@phosphor-icons/react'
import { useAviso } from '@/components/registro/Aviso'
import { arquivarMaterial } from '@/lib/acoes/registrar'
import s from './material.module.css'

/** Pedra que zerou e não vai mais ser comprada sai da lista, sem apagar o histórico. */
export function Arquivar({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [pendente, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()
  const { avisar } = useAviso()

  if (!confirmando) {
    return (
      <div className={s.arquivar}>
        <p>Essa pedra zerou. Se não vai mais trabalhar com ela, dá pra tirar da lista do estoque.</p>
        <button type="button" className="botao" onClick={() => setConfirmando(true)}>
          <Archive aria-hidden />
          Arquivar material
        </button>
      </div>
    )
  }

  return (
    <div className={s.arquivar} data-confirmando>
      <p>
        Arquivar <strong>{nome}</strong>? Ela some da lista e dos formulários. O histórico continua guardado.
      </p>
      {erro && <p className={s.erro}>{erro}</p>}
      <div className={s.arquivarBotoes}>
        <button
          type="button"
          className="botao botao-principal"
          disabled={pendente}
          onClick={() =>
            startTransition(async () => {
              const r = await arquivarMaterial(id)
              if (!r.ok) return setErro(r.erro)
              avisar({ titulo: 'Material arquivado.', linhas: [`${nome} saiu da lista do estoque.`], tom: 'ok' })
              router.push('/estoque')
            })
          }
        >
          {pendente ? 'Arquivando...' : 'Sim, arquivar'}
        </button>
        <button type="button" className="botao" onClick={() => setConfirmando(false)}>
          Não
        </button>
      </div>
    </div>
  )
}
