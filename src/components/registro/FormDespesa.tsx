'use client'

import { useState } from 'react'
import { corrigir } from '@/lib/acoes/lancamentos'
import { lancarDespesa } from '@/lib/acoes/registrar'
import { CATEGORIAS_DESPESA, dataCurta, lerNumero, reais, valorCampo } from '@/lib/formatos'
import { somarDias } from '@/lib/tempo'
import type { DadosDespesa } from '@/lib/tipos'
import { useAviso } from './Aviso'
import { CampoDinheiro, CampoTexto, Fichas, Grupo, Pergunta, Resumo } from './campos'
import { sugestoes, type PropsForm } from './comum'
import { Formulario, mensagemDe, novaChave, useEnvio, useErros } from './Formulario'
import { errosPagamento, Pagamento, pagamentoInicial, paraEnvio } from './Pagamento'
import s from './registro.module.css'

export function FormDespesa({ contatos, hoje, correcao, onFechar }: PropsForm) {
  const { avisar } = useAviso()
  const [chave] = useState(novaChave)

  const [descricao, setDescricao] = useState(correcao?.descricao ?? '')
  const [categoria, setCategoria] = useState<string | null>(correcao?.categoria ?? null)
  const [valor, setValor] = useState(correcao ? valorCampo(correcao.valor_total) : '')
  const [contraparte, setContraparte] = useState(correcao?.contraparte ?? '')
  const [pag, setPag] = useState(() => pagamentoInicial(somarDias(hoje, 10)))
  const [data, setData] = useState(correcao?.data ?? hoje)
  const [obs, setObs] = useState(correcao?.observacoes ?? '')
  const [motivo, setMotivo] = useState('')
  const [vencResto, setVencResto] = useState(correcao?.vencimento ?? somarDias(hoje, 10))

  const { erros, conferir } = useErros<string>()
  const { pendente, erro, enviar } = useEnvio()
  const total = lerNumero(valor)
  const restoCorrecao = correcao && total !== null ? total - correcao.quitado : 0

  function salvar() {
    const ok = conferir([
      ['descricao', !descricao.trim() && 'Diga o que foi a despesa.'],
      ['categoria', !categoria && 'Escolha o tipo da despesa.'],
      [
        'valor',
        !total || total <= 0
          ? 'Diga o valor.'
          : correcao && total < correcao.quitado
            ? `Já foi pago ${reais(correcao.quitado)}. O valor não pode ser menor que isso.`
            : null,
      ],
      ...(correcao ? [] : Object.entries(errosPagamento(pag, total, 'saida'))),
    ] as [string, string | false | null][])
    if (!ok) return

    const dados: DadosDespesa = {
      chave,
      data,
      descricao: descricao.trim(),
      categoria: categoria!,
      contraparte: contraparte.trim(),
      valor: total!,
      pagamento: correcao ? { modo: 'depois', vencimento: vencResto } : paraEnvio(pag),
      observacoes: obs.trim(),
    }
    enviar(
      () => (correcao ? corrigir(correcao.id, dados, motivo) : lancarDespesa(dados)),
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
      rotuloSalvar={correcao ? 'Salvar correção' : 'Salvar despesa'}
      pendente={pendente}
      erro={erro}
      onSalvar={salvar}
      onCancelar={onFechar}
    >
      <Pergunta rotulo="O que foi?" htmlFor="descricao" erro={erros.descricao}>
        <CampoTexto
          id="descricao"
          valor={descricao}
          onChange={setDescricao}
          placeholder="Ex.: frete de Salvador"
          invalido={!!erros.descricao}
        />
      </Pergunta>

      <Grupo legenda="Tipo de despesa" erro={erros.categoria}>
        <div id="categoria" tabIndex={-1}>
          <Fichas nome="categoria" valor={categoria} onChange={setCategoria} opcoes={CATEGORIAS_DESPESA} />
        </div>
      </Grupo>

      <div className={s.duas}>
        <Pergunta rotulo="Valor" htmlFor="valor" erro={erros.valor}>
          <CampoDinheiro id="valor" valor={valor} onChange={setValor} invalido={!!erros.valor} grande />
        </Pergunta>
        <Pergunta rotulo="Pago a quem?" htmlFor="contraparte" opcional>
          <CampoTexto id="contraparte" valor={contraparte} onChange={setContraparte} sugestoes={sugestoes(contatos.pagos)} />
        </Pergunta>
      </div>

      {correcao ? (
        <>
          <Resumo>
            {correcao.quitado > 0 ? (
              <p>
                Já pago: <strong>{reais(correcao.quitado)}</strong>. Esse pagamento continua valendo.
              </p>
            ) : (
              <p>Nada foi pago ainda dessa despesa.</p>
            )}
            {restoCorrecao > 0 && (
              <p>
                Fica a pagar: <strong>{reais(restoCorrecao)}</strong>
                {vencResto ? ` até ${dataCurta(vencResto)}` : ''}.
              </p>
            )}
          </Resumo>
          {restoCorrecao > 0 && (
            <Pergunta rotulo="Quando vence?" htmlFor="vencResto">
              <input id="vencResto" type="date" className="entrada" value={vencResto} onChange={(e) => setVencResto(e.target.value)} />
            </Pergunta>
          )}
        </>
      ) : (
        <Pagamento
          valor={pag}
          onChange={setPag}
          natureza="saida"
          total={total}
          contraparte={contraparte}
          erros={erros}
          permitirParte={false}
        />
      )}

      <div className={s.duas}>
        <Pergunta rotulo="Data" htmlFor="data">
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
