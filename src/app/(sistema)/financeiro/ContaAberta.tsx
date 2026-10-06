'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { CalendarBlank, Check } from '@phosphor-icons/react'
import { useAviso } from '@/components/registro/Aviso'
import { CampoDinheiro, Fichas } from '@/components/registro/campos'
import { mudarVencimento, quitar } from '@/lib/acoes/lancamentos'
import { dataCurta, FORMAS, lerNumero, prazo, reais, valorCampo } from '@/lib/formatos'
import s from './financeiro.module.css'

/*
 * Uma conta em aberto. "Recebi" / "Paguei" abre a confirmação ali mesmo na
 * linha (quanto, como e quando), sem janela por cima. Valor menor que o total
 * quita uma parte e o resto continua aberto.
 */
export function ContaAberta({
  id,
  natureza,
  valor,
  vencimento,
  quem,
  oque,
  numero,
  hoje,
}: {
  id: string
  natureza: 'entrada' | 'saida'
  valor: number
  vencimento: string
  quem: string
  oque: string
  numero: number
  hoje: string
}) {
  const entrada = natureza === 'entrada'
  const [modo, setModo] = useState<'nada' | 'quitar' | 'data'>('nada')
  const [quanto, setQuanto] = useState(valorCampo(valor))
  const [forma, setForma] = useState<string | null>(null)
  const [quando, setQuando] = useState(hoje)
  const [novaData, setNovaData] = useState(vencimento)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, startTransition] = useTransition()
  const { avisar } = useAviso()
  const situacao = prazo(vencimento, hoje)

  function confirmar() {
    const v = lerNumero(quanto)
    if (!v || v <= 0) return setErro('Diga o valor.')
    if (v > valor) return setErro(`O valor passa do que está em aberto (${reais(valor)}).`)
    if (!forma) return setErro(entrada ? 'Diga como recebeu.' : 'Diga como pagou.')
    setErro(null)
    startTransition(async () => {
      const r = await quitar(id, v, quando, forma)
      if (!r.ok) return setErro(r.erro)
      const resto = Math.round((valor - v) * 100) / 100
      avisar({
        titulo: entrada ? 'Recebimento salvo.' : 'Pagamento salvo.',
        linhas: [
          `${entrada ? 'Entrou' : 'Saiu'} ${reais(v)} ${entrada ? 'de' : 'para'} ${quem}.`,
          ...(resto > 0 ? [`Continua em aberto: ${reais(resto)}.`] : []),
        ],
        tom: 'ok',
        numero,
      })
      setModo('nada')
    })
  }

  function salvarData() {
    if (!novaData) return setErro('Escolha a nova data.')
    setErro(null)
    startTransition(async () => {
      const r = await mudarVencimento(id, novaData)
      if (!r.ok) return setErro(r.erro)
      avisar({ titulo: 'Data mudada.', linhas: [`${quem}: agora vence em ${dataCurta(novaData)}.`], tom: 'ok' })
      setModo('nada')
    })
  }

  return (
    <li className={s.conta} data-aberta={modo !== 'nada' || undefined}>
      <div className={s.contaLinha}>
        <Link href={`/historico/${numero}`} className={s.contaTexto}>
          <strong>{quem}</strong>
          <span>{oque}</span>
        </Link>
        <span className={s.contaValor}>
          <strong>{reais(valor)}</strong>
          <span
            className={situacao.atrasada || situacao.perto ? 'etiqueta etiqueta-ambar' : s.contaPrazo}
          >
            {situacao.texto}
          </span>
        </span>
        {modo === 'nada' && (
          <span className={s.contaBotoes}>
            <button type="button" className="botao botao-pequeno botao-principal" onClick={() => setModo('quitar')}>
              <Check weight="bold" aria-hidden />
              {entrada ? 'Recebi' : 'Paguei'}
            </button>
            <button type="button" className={s.mudarData} onClick={() => setModo('data')}>
              <CalendarBlank aria-hidden />
              Mudar data
            </button>
          </span>
        )}
      </div>

      {modo === 'quitar' && (
        <div className={s.quitar}>
          <div className={s.quitarCampos}>
            <div>
              <label htmlFor={`q-${id}`}>{entrada ? 'Quanto recebeu?' : 'Quanto pagou?'}</label>
              <CampoDinheiro id={`q-${id}`} valor={quanto} onChange={setQuanto} />
            </div>
            <div>
              <label htmlFor={`d-${id}`}>Quando?</label>
              <input id={`d-${id}`} type="date" className="entrada" value={quando} max={hoje} onChange={(e) => setQuando(e.target.value)} />
            </div>
          </div>
          <fieldset className={s.quitarFormas}>
            <legend>Como?</legend>
            <Fichas nome={`f-${id}`} valor={forma} onChange={setForma} opcoes={FORMAS} />
          </fieldset>
          {lerNumero(quanto) !== null && (lerNumero(quanto) ?? 0) < valor && (lerNumero(quanto) ?? 0) > 0 && (
            <p className={s.parcial}>Valor menor que o total: o resto, {reais(valor - (lerNumero(quanto) ?? 0))}, continua em aberto.</p>
          )}
          {erro && <p className={s.erro}>{erro}</p>}
          <div className={s.quitarBotoes}>
            <button type="button" className="botao botao-principal" onClick={confirmar} disabled={pendente}>
              {pendente ? 'Salvando...' : 'Confirmar'}
            </button>
            <button type="button" className="botao" onClick={() => (setModo('nada'), setErro(null))}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modo === 'data' && (
        <div className={s.quitar}>
          <div className={s.quitarCampos}>
            <div>
              <label htmlFor={`n-${id}`}>Nova data</label>
              <input id={`n-${id}`} type="date" className="entrada" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
            </div>
          </div>
          {erro && <p className={s.erro}>{erro}</p>}
          <div className={s.quitarBotoes}>
            <button type="button" className="botao botao-principal" onClick={salvarData} disabled={pendente}>
              {pendente ? 'Salvando...' : 'Salvar data'}
            </button>
            <button type="button" className="botao" onClick={() => (setModo('nada'), setErro(null))}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
