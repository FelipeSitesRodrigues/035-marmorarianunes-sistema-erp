'use client'

import { useState, useTransition } from 'react'
import { ArrowCounterClockwise, Prohibit } from '@phosphor-icons/react'
import { useAviso } from '@/components/registro/Aviso'
import { cancelar, reabrir } from '@/lib/acoes/lancamentos'
import s from './detalhe.module.css'

const PERGUNTA: Record<string, string> = {
  venda: 'A pedra volta pro estoque e o dinheiro dessa venda deixa de contar.',
  compra: 'A pedra sai do estoque e o pagamento dessa compra deixa de contar.',
  saida: 'A pedra volta pro estoque.',
  despesa: 'Essa despesa deixa de contar no dinheiro.',
  cadastro: 'O material sai da lista do estoque.',
  ajuste: 'A quantidade volta a ser a de antes do ajuste.',
}

/** Cancelar com confirmação ali mesmo, pedindo o motivo (vai pro histórico). */
export function Cancelar({ id, tipo }: { id: string; tipo: string }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, startTransition] = useTransition()
  const { avisar } = useAviso()

  if (!aberto) {
    return (
      <button type="button" className="botao" onClick={() => setAberto(true)}>
        <Prohibit aria-hidden />
        Cancelar lançamento
      </button>
    )
  }

  return (
    <div className={s.confirmar}>
      <p>
        <strong>Cancelar este lançamento?</strong> {PERGUNTA[tipo]} Ele continua aqui no histórico, marcado como cancelado.
      </p>
      <label htmlFor="motivo-cancelar">Por quê? (opcional)</label>
      <input
        id="motivo-cancelar"
        className="entrada"
        value={motivo}
        maxLength={200}
        placeholder="Ex.: cliente desistiu"
        onChange={(e) => setMotivo(e.target.value)}
      />
      {erro && <p className={s.erro}>{erro}</p>}
      <div className={s.confirmarBotoes}>
        <button
          type="button"
          className="botao botao-principal"
          disabled={pendente}
          onClick={() =>
            startTransition(async () => {
              const r = await cancelar(id, motivo)
              if (!r.ok) return setErro(r.erro)
              avisar({ titulo: 'Lançamento cancelado.', linhas: ['O estoque e o dinheiro voltaram como estavam.'], tom: 'ok' })
              setAberto(false)
            })
          }
        >
          {pendente ? 'Cancelando...' : 'Sim, cancelar'}
        </button>
        <button type="button" className="botao" onClick={() => (setAberto(false), setErro(null))}>
          Não
        </button>
      </div>
    </div>
  )
}

/** Desfaz um "Recebi"/"Paguei" marcado sem querer: a conta volta a ficar em aberto. */
export function Reabrir({ id, natureza }: { id: string; natureza: 'entrada' | 'saida' }) {
  const [confirmando, setConfirmando] = useState(false)
  const [pendente, startTransition] = useTransition()
  const { avisar } = useAviso()

  if (!confirmando) {
    return (
      <button type="button" className={s.reabrir} onClick={() => setConfirmando(true)}>
        <ArrowCounterClockwise aria-hidden />
        Desfazer
      </button>
    )
  }
  return (
    <span className={s.reabrirConfirma}>
      Voltar pra {natureza === 'entrada' ? 'a receber' : 'a pagar'}?
      <button
        type="button"
        className="botao botao-pequeno botao-principal"
        disabled={pendente}
        onClick={() =>
          startTransition(async () => {
            const r = await reabrir(id)
            avisar(
              r.ok
                ? { titulo: 'Desfeito.', linhas: ['O valor voltou a ficar em aberto.'], tom: 'ok' }
                : { titulo: 'Não deu pra desfazer.', linhas: [r.erro], tom: 'erro' },
            )
            setConfirmando(false)
          })
        }
      >
        Sim
      </button>
      <button type="button" className="botao botao-pequeno" onClick={() => setConfirmando(false)}>
        Não
      </button>
    </span>
  )
}
