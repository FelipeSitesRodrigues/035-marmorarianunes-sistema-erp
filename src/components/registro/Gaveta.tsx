'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { carregarParaCorrigir } from '@/lib/acoes/lancamentos'
import type { Contatos, MaterialOpcao, OperacaoParaCorrigir } from '@/lib/tipos'
import { FormAjuste } from './FormAjuste'
import { FormCompra } from './FormCompra'
import { FormDespesa } from './FormDespesa'
import { FormMaterial } from './FormMaterial'
import { FormSaida } from './FormSaida'
import { FormVenda } from './FormVenda'
import s from './registro.module.css'

/*
 * O painel que abre por cima de qualquer tela, comandado pelo endereço:
 *   ?registrar=venda | compra | saida | despesa | material | ajuste | editar
 *   &material=<id>      já abre com a pedra escolhida
 *   ?corrigir=<id>      abre o formulário da operação, preenchido
 * Pelo endereço, o botão Voltar do celular fecha o painel em vez de sair da tela.
 */

const TITULOS: Record<string, string> = {
  venda: 'Registrar venda',
  compra: 'Registrar compra',
  saida: 'Registrar saída',
  despesa: 'Lançar despesa',
  material: 'Cadastrar material',
  ajuste: 'Ajustar estoque',
  editar: 'Editar material',
}

const NOME_TIPO: Record<string, string> = { venda: 'venda', compra: 'compra', saida: 'saída', despesa: 'despesa' }

export function Gaveta({ materiais, contatos, hoje }: { materiais: MaterialOpcao[]; contatos: Contatos; hoje: string }) {
  const params = useSearchParams()
  const caminho = usePathname()
  const router = useRouter()
  const dialogo = useRef<HTMLDialogElement>(null)

  const registrar = params.get('registrar')
  const corrigirId = params.get('corrigir')
  const materialId = params.get('material')
  const aberto = (!!registrar && registrar in TITULOS) || !!corrigirId

  const [correcao, setCorrecao] = useState<{ id: string; op: OperacaoParaCorrigir | null } | null>(null)

  const fechar = useCallback(() => {
    const p = new URLSearchParams(params.toString())
    p.delete('registrar')
    p.delete('material')
    p.delete('corrigir')
    const resto = p.toString()
    router.replace(resto ? `${caminho}?${resto}` : caminho, { scroll: false })
  }, [params, caminho, router])

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberto && !d.open) {
      d.showModal()
      // Foco no título, não no Fechar: quem lê pela tela ouve o nome do formulário primeiro
      d.querySelector<HTMLElement>('#gaveta-titulo')?.focus()
    }
    if (!aberto && d.open) d.close()
  }, [aberto])

  useEffect(() => {
    if (!corrigirId || correcao?.id === corrigirId) return
    let vivo = true
    carregarParaCorrigir(corrigirId).then((op) => vivo && setCorrecao({ id: corrigirId, op }))
    return () => {
      vivo = false
    }
  }, [corrigirId, correcao?.id])

  const carregando = !!corrigirId && correcao?.id !== corrigirId
  const op = corrigirId && correcao?.id === corrigirId ? correcao.op : null
  const tipo = corrigirId ? op?.tipo : registrar
  const titulo = corrigirId
    ? op
      ? `Corrigir ${NOME_TIPO[op.tipo]} nº ${op.numero}`
      : 'Corrigir lançamento'
    : (TITULOS[registrar ?? ''] ?? '')

  const props = {
    materiais,
    contatos,
    hoje,
    materialInicial: materialId,
    correcao: op,
    onFechar: fechar,
  }
  const chave = `${registrar}-${materialId}-${corrigirId}`

  return (
    <dialog
      ref={dialogo}
      className={s.gaveta}
      aria-labelledby="gaveta-titulo"
      onCancel={(e) => {
        e.preventDefault()
        fechar()
      }}
    >
      {aberto && (
        <div className={s.gavetaCaixa}>
          <header className={s.gavetaTopo}>
            <h2 id="gaveta-titulo" tabIndex={-1}>
              {titulo}
            </h2>
            <button type="button" className={s.fecharGaveta} onClick={fechar}>
              <X aria-hidden />
              Fechar
            </button>
          </header>

          {corrigirId && (
            <p className={s.avisoCorrecao}>
              O lançamento original fica guardado no histórico, marcado como corrigido.
            </p>
          )}

          {carregando ? (
            <div className={s.carregando} aria-busy="true">
              <span />
              <span />
              <span />
            </div>
          ) : corrigirId && !op ? (
            <p className={s.explicacao} style={{ padding: 28 }}>
              Esse lançamento não pode mais ser corrigido (já foi corrigido ou cancelado antes).
            </p>
          ) : tipo === 'venda' ? (
            <FormVenda key={chave} {...props} />
          ) : tipo === 'compra' ? (
            <FormCompra key={chave} {...props} />
          ) : tipo === 'saida' ? (
            <FormSaida key={chave} {...props} />
          ) : tipo === 'despesa' ? (
            <FormDespesa key={chave} {...props} />
          ) : tipo === 'material' ? (
            <FormMaterial key={chave} {...props} />
          ) : tipo === 'editar' ? (
            <FormMaterial key={chave} {...props} editando={materiais.find((m) => m.id === materialId) ?? null} />
          ) : tipo === 'ajuste' ? (
            <FormAjuste key={chave} {...props} />
          ) : null}
        </div>
      )}
    </dialog>
  )
}
