'use client'

import { useMemo, useState } from 'react'
import { corrigir } from '@/lib/acoes/lancamentos'
import { registrarCompra } from '@/lib/acoes/registrar'
import { dataCurta, lerNumero, reais } from '@/lib/formatos'
import { somarDias } from '@/lib/tempo'
import type { DadosCompra } from '@/lib/tipos'
import { useAviso } from './Aviso'
import { CampoTexto, Grupo, Pergunta, Resumo } from './campos'
import { estoqueNaCorrecao, itensIniciais, sugestoes, type PropsForm } from './comum'
import { Formulario, mensagemDe, novaChave, useEnvio, useErros } from './Formulario'
import { errosItens, Itens, totalItens } from './Itens'
import { errosPagamento, Pagamento, pagamentoInicial, paraEnvio } from './Pagamento'
import s from './registro.module.css'

export function FormCompra({ materiais, contatos, hoje, materialInicial, correcao, onFechar }: PropsForm) {
  const { avisar } = useAviso()
  const [chave] = useState(novaChave)
  const estoque = useMemo(() => estoqueNaCorrecao(materiais, correcao), [materiais, correcao])
  const fornecedorDoMaterial = materiais.find((m) => m.id === materialInicial)?.fornecedor ?? ''

  const [fornecedor, setFornecedor] = useState(correcao?.contraparte ?? fornecedorDoMaterial)
  const [itens, setItens] = useState(() => itensIniciais(correcao, materialInicial))
  const [pag, setPag] = useState(() => pagamentoInicial(somarDias(hoje, 30)))
  const [data, setData] = useState(correcao?.data ?? hoje)
  const [obs, setObs] = useState(correcao?.observacoes ?? '')
  const [motivo, setMotivo] = useState('')
  const [vencResto, setVencResto] = useState(correcao?.vencimento ?? somarDias(hoje, 30))

  const { erros, conferir } = useErros<string>()
  const { pendente, erro, enviar } = useEnvio()
  const total = totalItens(itens)
  const restoCorrecao = correcao ? total - correcao.quitado : 0

  function salvar() {
    const ok = conferir([
      ['fornecedor', !fornecedor.trim() && 'Diga de qual fornecedor veio.'],
      ...Object.entries(errosItens(itens, estoque, 'entrada')),
      ...(correcao ? [] : Object.entries(errosPagamento(pag, total, 'saida'))),
      [
        'item_0_valor',
        correcao && total < correcao.quitado && `Já foi pago ${reais(correcao.quitado)}. O total não pode ser menor que isso.`,
      ],
    ] as [string, string | false | null][])
    if (!ok) return

    const dados: DadosCompra = {
      chave,
      data,
      fornecedor: fornecedor.trim(),
      itens: itens.map((i) => ({
        material_id: i.material!,
        quantidade: lerNumero(i.quantidade)!,
        valor_unitario: lerNumero(i.valor) ?? 0,
      })),
      pagamento: correcao ? { modo: 'depois', vencimento: vencResto } : paraEnvio(pag),
      observacoes: obs.trim(),
    }
    enviar(
      () => (correcao ? corrigir(correcao.id, dados, motivo) : registrarCompra(dados)),
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
      rotuloSalvar={correcao ? 'Salvar correção' : 'Salvar compra'}
      pendente={pendente}
      erro={erro}
      onSalvar={salvar}
      onCancelar={onFechar}
    >
      <Pergunta rotulo="De qual fornecedor?" htmlFor="fornecedor" erro={erros.fornecedor}>
        <CampoTexto
          id="fornecedor"
          valor={fornecedor}
          onChange={setFornecedor}
          sugestoes={sugestoes(contatos.fornecedores)}
          placeholder="Nome do fornecedor"
          invalido={!!erros.fornecedor}
          maxLength={80}
        />
      </Pergunta>

      <Grupo legenda="O que chegou?" ajuda="Pedra nova, que ainda não está na lista? Cadastre primeiro em Cadastrar material.">
        <Itens
          itens={itens}
          onChange={setItens}
          materiais={estoque}
          sentido="entrada"
          erros={erros}
          rotuloMais="Outra pedra desta compra"
        />
      </Grupo>

      <div className={s.totalLinha}>
        <span>Total da compra</span>
        <strong>{reais(total)}</strong>
      </div>

      {correcao ? (
        <>
          <Resumo>
            {correcao.quitado > 0 ? (
              <p>
                Já pago: <strong>{reais(correcao.quitado)}</strong>. Esse pagamento continua valendo.
              </p>
            ) : (
              <p>Nada foi pago ainda dessa compra.</p>
            )}
            {restoCorrecao > 0 && (
              <p>
                Fica a pagar: <strong>{reais(restoCorrecao)}</strong>
                {vencResto ? ` até ${dataCurta(vencResto)}` : ''}.
              </p>
            )}
          </Resumo>
          {restoCorrecao > 0 && (
            <Pergunta rotulo="Quando vence o restante?" htmlFor="vencResto">
              <input id="vencResto" type="date" className="entrada" value={vencResto} onChange={(e) => setVencResto(e.target.value)} />
            </Pergunta>
          )}
        </>
      ) : (
        <Pagamento valor={pag} onChange={setPag} natureza="saida" total={total} contraparte={fornecedor} erros={erros} />
      )}

      <div className={s.duas}>
        <Pergunta rotulo="Data da compra" htmlFor="data">
          <input id="data" type="date" className="entrada" value={data} max={hoje} onChange={(e) => setData(e.target.value || hoje)} />
        </Pergunta>
        <Pergunta rotulo="Observação" htmlFor="obs" opcional>
          <CampoTexto id="obs" valor={obs} onChange={setObs} placeholder="Ex.: número da nota" maxLength={500} />
        </Pergunta>
      </div>

      {correcao && (
        <Pergunta rotulo="O que estava errado?" htmlFor="motivo" opcional ajuda="Fica anotado no histórico, junto com o original.">
          <CampoTexto id="motivo" valor={motivo} onChange={setMotivo} placeholder="Ex.: o preço da chapa" maxLength={200} />
        </Pergunta>
      )}
    </Formulario>
  )
}
