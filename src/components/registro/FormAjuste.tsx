'use client'

import { useState } from 'react'
import { ajustarEstoque } from '@/lib/acoes/registrar'
import { lerNumero, numeroBR, qtd } from '@/lib/formatos'
import { useAviso } from './Aviso'
import { CampoTexto, EscolhaMaterial, Fichas, Grupo, Pergunta, Quantidade, Resumo } from './campos'
import type { PropsForm } from './comum'
import { Formulario, mensagemDe, novaChave, useEnvio, useErros } from './Formulario'
import s from './registro.module.css'

const MOTIVOS = ['Contagem do pátio', 'Erro de lançamento antigo', 'Sobra de obra que voltou', 'Outro'] as const

/** Contou o pátio e o número não bate: a quantidade certa entra, sem mexer no dinheiro. */
export function FormAjuste({ materiais, hoje, materialInicial, onFechar }: PropsForm) {
  const { avisar } = useAviso()
  const [chave] = useState(novaChave)
  const [material, setMaterial] = useState<string | null>(materialInicial ?? null)
  const m = materiais.find((x) => x.id === material) ?? null
  const [contada, setContada] = useState(m ? numeroBR(m.quantidade) : '')
  const [motivo, setMotivo] = useState<string | null>('Contagem do pátio')
  const [detalhe, setDetalhe] = useState('')

  const { erros, conferir } = useErros<string>()
  const { pendente, erro, enviar } = useEnvio()
  const n = lerNumero(contada)
  const diferenca = m && n !== null ? Math.round((n - m.quantidade) * 1000) / 1000 : 0

  function salvar() {
    const ok = conferir([
      ['material', !m && 'Escolha a pedra.'],
      ['contada', (n === null || n < 0) && 'Diga quanto tem de verdade.'],
      ['contada', m && n !== null && diferenca === 0 && 'É a mesma quantidade do sistema. Nada pra ajustar.'],
      ['detalhe', motivo === 'Outro' && !detalhe.trim() && 'Conte o motivo.'],
    ] as [string, string | false | null][])
    if (!ok) return
    enviar(
      () =>
        ajustarEstoque({
          chave,
          data: hoje,
          material_id: m!.id,
          quantidade_contada: n!,
          motivo: motivo === 'Outro' ? detalhe.trim() : motivo!,
          observacoes: motivo === 'Outro' ? undefined : detalhe.trim() || undefined,
        }),
      (r) => {
        avisar({ ...mensagemDe(r.resumo!), tom: 'ok', operacaoId: r.resumo!.id, numero: r.resumo!.numero })
        onFechar()
      },
    )
  }

  return (
    <Formulario rotuloSalvar="Salvar ajuste" pendente={pendente} erro={erro} onSalvar={salvar} onCancelar={onFechar}>
      <p className={s.explicacao}>
        Use quando contar o pátio e o número não bater com o sistema. O dinheiro não mexe, e o ajuste fica no histórico.
      </p>

      <Pergunta rotulo="Qual pedra?" htmlFor="material" erro={erros.material}>
        <EscolhaMaterial
          id="material"
          materiais={materiais}
          valor={material}
          onChange={(id) => {
            setMaterial(id)
            const novo = materiais.find((x) => x.id === id)
            if (novo) setContada(numeroBR(novo.quantidade))
          }}
          invalido={!!erros.material}
        />
      </Pergunta>

      {m && (
        <>
          <Pergunta rotulo="Quanto tem de verdade?" htmlFor="contada" erro={erros.contada}>
            <Quantidade id="contada" valor={contada} onChange={setContada} unidade={m.unidade} invalido={!!erros.contada} />
          </Pergunta>
          {diferenca !== 0 && n !== null && (
            <Resumo tom="ambar">
              <p>
                No sistema: <strong>{qtd(m.quantidade, m.unidade)}</strong>. Depois do ajuste:{' '}
                <strong>{qtd(n, m.unidade)}</strong> ({diferenca > 0 ? 'entram' : 'saem'}{' '}
                {qtd(Math.abs(diferenca), m.unidade)}).
              </p>
            </Resumo>
          )}
        </>
      )}

      <Grupo legenda="Por que mudou?">
        <Fichas nome="motivoAjuste" valor={motivo} onChange={setMotivo} opcoes={MOTIVOS} />
      </Grupo>

      <Pergunta rotulo={motivo === 'Outro' ? 'Qual o motivo?' : 'Detalhe'} htmlFor="detalhe" opcional={motivo !== 'Outro'} erro={erros.detalhe}>
        <CampoTexto id="detalhe" valor={detalhe} onChange={setDetalhe} maxLength={200} invalido={!!erros.detalhe} />
      </Pergunta>
    </Formulario>
  )
}
