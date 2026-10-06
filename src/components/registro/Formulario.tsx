'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { Warning } from '@phosphor-icons/react'
import { dataCurta, qtd, reais } from '@/lib/formatos'
import type { Resumo } from '@/lib/tipos'
import s from './registro.module.css'

/* Casca de todo formulário: corpo que rola e rodapé fixo com Salvar. */
export function Formulario({
  children,
  rotuloSalvar,
  pendente,
  erro,
  onSalvar,
  onCancelar,
  bloqueado,
}: {
  children: ReactNode
  rotuloSalvar: string
  pendente: boolean
  erro: string | null
  onSalvar: () => void
  onCancelar: () => void
  bloqueado?: boolean
}) {
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!pendente && !bloqueado) onSalvar()
      }}
    >
      <div className={s.corpo}>{children}</div>
      <div className={s.rodape}>
        {erro && (
          <p className={s.erroGeral} role="alert">
            <Warning weight="fill" aria-hidden />
            {erro}
          </p>
        )}
        <div className={s.rodapeBotoes}>
          <button type="submit" className="botao botao-principal" disabled={pendente || bloqueado}>
            {pendente ? 'Salvando...' : rotuloSalvar}
          </button>
          <button type="button" className="botao" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  )
}

type Retorno = { ok: true; resumo?: Resumo } | { ok: false; erro: string }

/** Envio com estado de "Salvando..." e erro do servidor guardado. */
export function useEnvio() {
  const [pendente, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function enviar<R extends Retorno>(acao: () => Promise<R>, aoSalvar: (r: Extract<R, { ok: true }>) => void) {
    setErro(null)
    startTransition(async () => {
      try {
        const r = await acao()
        if (r.ok) aoSalvar(r as Extract<R, { ok: true }>)
        else setErro(r.erro)
      } catch {
        setErro('Não deu pra salvar agora. Confira a internet e tente de novo.')
      }
    })
  }

  return { pendente, erro, setErro, enviar }
}

/** Erros de campo: guarda a mensagem e leva o cursor pro primeiro campo errado. */
export function useErros<C extends string>() {
  const [erros, setErros] = useState<Partial<Record<C, string>>>({})
  function conferir(lista: [C, string | false | null | undefined][]) {
    const novos: Partial<Record<C, string>> = {}
    for (const [campo, msg] of lista) if (msg) novos[campo] = msg
    setErros(novos)
    const primeiro = lista.find(([, msg]) => msg)?.[0]
    if (primeiro) {
      requestAnimationFrame(() => {
        const el = document.getElementById(primeiro)
        el?.focus()
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
      return false
    }
    return true
  }
  const limpar = (campo: C) => erros[campo] && setErros((e) => ({ ...e, [campo]: undefined }))
  return { erros, conferir, limpar }
}

export function novaChave() {
  return crypto.randomUUID()
}

/** A frase da confirmação: o que mudou no estoque e no dinheiro. */
export function mensagemDe(r: Resumo, correcao = false): { titulo: string; linhas: string[] } {
  const linhas: string[] = []
  for (const m of r.materiais) {
    if (r.tipo === 'cadastro') {
      linhas.push(`${m.nome} entrou com ${qtd(m.quantidade, m.unidade)}.`)
      continue
    }
    const abaixo = m.estoque_minimo > 0 && m.quantidade <= m.estoque_minimo
    linhas.push(
      `${m.nome} agora tem ${qtd(m.quantidade, m.unidade)}.${abaixo && m.movido < 0 ? ' Chegou no mínimo: hora de repor.' : ''}`,
    )
  }
  const quem = r.contraparte ? ` de ${r.contraparte}` : ''
  const ate = r.vencimento ? ` até ${dataCurta(r.vencimento)}` : ''
  if (r.tipo === 'venda') {
    if (r.quitado > 0) linhas.push(`Entrou ${reais(r.quitado)} no caixa.`)
    if (r.pendente > 0) linhas.push(`Fica a receber ${reais(r.pendente)}${quem}${ate}.`)
  }
  if (r.tipo === 'compra' || r.tipo === 'despesa') {
    if (r.quitado > 0) linhas.push(`Saiu ${reais(r.quitado)} do caixa.`)
    if (r.pendente > 0) linhas.push(`Fica a pagar ${reais(r.pendente)}${ate}.`)
  }
  const titulos: Record<string, string> = {
    venda: 'Venda salva.',
    compra: 'Compra salva.',
    saida: 'Saída salva.',
    despesa: 'Despesa lançada.',
    cadastro: 'Material cadastrado.',
    ajuste: 'Estoque ajustado.',
  }
  return { titulo: correcao ? 'Correção salva. O original ficou guardado no histórico.' : titulos[r.tipo], linhas }
}
