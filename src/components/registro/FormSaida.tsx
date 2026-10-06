'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { corrigir } from '@/lib/acoes/lancamentos'
import { registrarSaida } from '@/lib/acoes/registrar'
import { lerNumero } from '@/lib/formatos'
import type { DadosSaida, MotivoSaida } from '@/lib/tipos'
import { useAviso } from './Aviso'
import { CampoTexto, Grupo, Opcoes, Pergunta } from './campos'
import { estoqueNaCorrecao, itensIniciais, sugestoes, type PropsForm } from './comum'
import { Formulario, mensagemDe, novaChave, useEnvio, useErros } from './Formulario'
import { errosItens, Itens } from './Itens'
import s from './registro.module.css'

const MOTIVOS: { valor: MotivoSaida; titulo: string }[] = [
  { valor: 'obra', titulo: 'Usar numa obra' },
  { valor: 'perda', titulo: 'Perdeu ou quebrou' },
  { valor: 'descarte', titulo: 'Descarte' },
  { valor: 'outro', titulo: 'Outro motivo' },
]

export function FormSaida({ materiais, contatos, hoje, materialInicial, correcao, onFechar }: PropsForm) {
  const { avisar } = useAviso()
  const caminho = usePathname()
  const params = useSearchParams()
  const [chave] = useState(novaChave)
  const estoque = useMemo(() => estoqueNaCorrecao(materiais, correcao), [materiais, correcao])

  const [motivoSaida, setMotivoSaida] = useState<MotivoSaida | null>((correcao?.motivo as MotivoSaida) ?? null)
  const [itens, setItens] = useState(() => itensIniciais(correcao, materialInicial))
  const [referencia, setReferencia] = useState(correcao?.referencia ?? '')
  const [data, setData] = useState(correcao?.data ?? hoje)
  const [obs, setObs] = useState(correcao?.observacoes ?? '')
  const [motivo, setMotivo] = useState('')

  const { erros, conferir } = useErros<string>()
  const { pendente, erro, enviar } = useEnvio()

  const paraVenda = useMemo(() => {
    const p = new URLSearchParams(params.toString())
    p.set('registrar', 'venda')
    const primeiro = itens[0]?.material
    if (primeiro) p.set('material', primeiro)
    return `${caminho}?${p.toString()}`
  }, [caminho, params, itens])

  function salvar() {
    const ok = conferir([
      ['motivoSaida', !motivoSaida && 'Escolha por que a pedra está saindo.'],
      ...Object.entries(errosItens(itens, estoque, 'saida')),
    ] as [string, string | false | null][])
    if (!ok) return

    const dados: DadosSaida = {
      chave,
      data,
      motivo: motivoSaida!,
      referencia: referencia.trim(),
      itens: itens.map((i) => ({ material_id: i.material!, quantidade: lerNumero(i.quantidade)! })),
      observacoes: obs.trim(),
    }
    enviar(
      () => (correcao ? corrigir(correcao.id, dados, motivo) : registrarSaida(dados)),
      (r) => {
        avisar({
          ...mensagemDe(r.resumo!, !!correcao),
          tom: 'ok',
          operacaoId: correcao ? undefined : r.resumo!.id,
          numero: r.resumo!.numero,
        })
        onFechar()
      },
    )
  }

  return (
    <Formulario
      rotuloSalvar={correcao ? 'Salvar correção' : 'Salvar saída'}
      pendente={pendente}
      erro={erro}
      onSalvar={salvar}
      onCancelar={onFechar}
    >
      {!correcao && (
        <p className={s.explicacao}>
          A pedra sai do estoque e o dinheiro não mexe. Se ela foi vendida, <Link href={paraVenda}>registre como venda</Link>.
        </p>
      )}

      <Grupo legenda="Por que está saindo?" erro={erros.motivoSaida}>
        <div id="motivoSaida" tabIndex={-1}>
          <Opcoes nome="motivoSaida" valor={motivoSaida} onChange={setMotivoSaida} opcoes={MOTIVOS} colunas={2} />
        </div>
      </Grupo>

      <Grupo legenda="Qual pedra?">
        <Itens itens={itens} onChange={setItens} materiais={estoque} sentido="saida" erros={erros} rotuloMais="Outra pedra" />
      </Grupo>

      <Pergunta
        rotulo={motivoSaida === 'obra' ? 'Qual obra ou cliente?' : 'O que aconteceu?'}
        htmlFor="referencia"
        opcional
      >
        <CampoTexto
          id="referencia"
          valor={referencia}
          onChange={setReferencia}
          sugestoes={motivoSaida === 'obra' ? sugestoes(contatos.obras, contatos.clientes) : undefined}
          placeholder={motivoSaida === 'obra' ? 'Ex.: escada do Sr. Marcos' : 'Ex.: trincou no transporte'}
        />
      </Pergunta>

      <div className={s.duas}>
        <Pergunta rotulo="Data da saída" htmlFor="data">
          <input id="data" type="date" className="entrada" value={data} max={hoje} onChange={(e) => setData(e.target.value || hoje)} />
        </Pergunta>
        <Pergunta rotulo="Observação" htmlFor="obs" opcional>
          <CampoTexto id="obs" valor={obs} onChange={setObs} maxLength={500} />
        </Pergunta>
      </div>

      {correcao && (
        <Pergunta rotulo="O que estava errado?" htmlFor="motivo" opcional ajuda="Fica anotado no histórico, junto com o original.">
          <CampoTexto id="motivo" valor={motivo} onChange={setMotivo} maxLength={200} />
        </Pergunta>
      )}
    </Formulario>
  )
}
