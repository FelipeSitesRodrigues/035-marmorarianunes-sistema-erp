'use client'

import { useMemo, useState } from 'react'
import { corrigir } from '@/lib/acoes/lancamentos'
import { registrarVenda } from '@/lib/acoes/registrar'
import { dataCurta, lerNumero, reais, valorCampo } from '@/lib/formatos'
import { somarDias } from '@/lib/tempo'
import type { DadosVenda } from '@/lib/tipos'
import { useAviso } from './Aviso'
import { CampoDinheiro, CampoTexto, Grupo, Opcoes, Pergunta, Resumo } from './campos'
import { estoqueNaCorrecao, itensIniciais, type PropsForm } from './comum'
import { Formulario, mensagemDe, novaChave, useEnvio, useErros } from './Formulario'
import { errosItens, itemVazio, Itens } from './Itens'
import { errosPagamento, Pagamento, pagamentoInicial, paraEnvio } from './Pagamento'
import s from './registro.module.css'

export function FormVenda({ materiais, contatos, hoje, materialInicial, correcao, onFechar }: PropsForm) {
  const { avisar } = useAviso()
  const [chave] = useState(novaChave)
  const estoque = useMemo(() => estoqueNaCorrecao(materiais, correcao), [materiais, correcao])

  const [itens, setItens] = useState(() => itensIniciais(correcao, materialInicial))
  // Venda só de serviço (mão de obra, polimento): pergunta direta, em vez de esconder na lixeira
  const [comPedra, setComPedra] = useState<'sim' | 'nao'>(correcao && correcao.itens.length === 0 ? 'nao' : 'sim')
  const [cliente, setCliente] = useState(correcao?.contraparte ?? '')
  const [servico, setServico] = useState(correcao?.referencia ?? '')
  const [valor, setValor] = useState(correcao ? valorCampo(correcao.valor_total) : '')
  const [pag, setPag] = useState(() => pagamentoInicial(somarDias(hoje, 30)))
  const [data, setData] = useState(correcao?.data ?? hoje)
  const [obs, setObs] = useState(correcao?.observacoes ?? '')
  const [motivo, setMotivo] = useState('')
  const [vencResto, setVencResto] = useState(correcao?.vencimento ?? somarDias(hoje, 30))

  const { erros, conferir } = useErros<string>()
  const { pendente, erro, enviar } = useEnvio()
  const total = lerNumero(valor)
  const restoCorrecao = correcao && total !== null ? total - correcao.quitado : 0

  function salvar() {
    const ok = conferir([
      ...(comPedra === 'sim' ? Object.entries(errosItens(itens, estoque, 'saida')) : []),
      ['cliente', !cliente.trim() && 'Diga pra quem foi a venda.'],
      [
        'valor',
        !total || total <= 0
          ? 'Diga o valor total da venda.'
          : correcao && total < correcao.quitado
            ? `Já foi recebido ${reais(correcao.quitado)}. O total não pode ser menor que isso.`
            : null,
      ],
      ...(correcao ? [] : Object.entries(errosPagamento(pag, total, 'entrada'))),
      ['vencResto', !!correcao && restoCorrecao > 0 && !vencResto && 'Escolha a data do restante.'],
    ] as [string, string | false | null][])
    if (!ok) return

    const dados: DadosVenda = {
      chave,
      data,
      cliente: cliente.trim(),
      servico: servico.trim(),
      itens: comPedra === 'sim' ? itens.map((i) => ({ material_id: i.material!, quantidade: lerNumero(i.quantidade)! })) : [],
      valor_total: total!,
      pagamento: correcao ? { modo: 'depois', vencimento: vencResto } : paraEnvio(pag),
      observacoes: obs.trim(),
    }
    enviar(
      () => (correcao ? corrigir(correcao.id, dados, motivo) : registrarVenda(dados)),
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
      rotuloSalvar={correcao ? 'Salvar correção' : 'Salvar venda'}
      pendente={pendente}
      erro={erro}
      onSalvar={salvar}
      onCancelar={onFechar}
    >
      <Grupo legenda="Saiu pedra do estoque nesta venda?">
        <Opcoes
          nome="comPedra"
          valor={comPedra}
          onChange={(v) => {
            setComPedra(v)
            if (v === 'sim' && itens.length === 0) setItens([itemVazio()])
          }}
          opcoes={[
            { valor: 'sim', titulo: 'Sim, saiu pedra' },
            { valor: 'nao', titulo: 'Não, só serviço', descricao: 'Mão de obra, polimento, instalação' },
          ]}
          colunas={2}
        />
      </Grupo>

      {comPedra === 'sim' && (
        <Grupo legenda="Qual pedra?">
          <Itens
            itens={itens}
            onChange={setItens}
            materiais={estoque}
            sentido="saida"
            erros={erros}
            rotuloMais="Outra pedra nesta venda"
          />
        </Grupo>
      )}

      <div className={s.duas}>
        <Pergunta rotulo="Para quem?" htmlFor="cliente" erro={erros.cliente}>
          <CampoTexto
            id="cliente"
            valor={cliente}
            onChange={setCliente}
            sugestoes={contatos.clientes}
            placeholder="Nome do cliente"
            invalido={!!erros.cliente}
            maxLength={80}
          />
        </Pergunta>
        <Pergunta rotulo="Pra qual serviço?" htmlFor="servico" opcional>
          <CampoTexto id="servico" valor={servico} onChange={setServico} placeholder="Ex.: bancada da cozinha" />
        </Pergunta>
      </div>

      <Pergunta rotulo="Valor total da venda" htmlFor="valor" erro={erros.valor}>
        <CampoDinheiro id="valor" valor={valor} onChange={setValor} invalido={!!erros.valor} grande />
      </Pergunta>

      {correcao ? (
        <>
          <Resumo tom="verde">
            {correcao.quitado > 0 ? (
              <p>
                Já recebido: <strong>{reais(correcao.quitado)}</strong>. Esse dinheiro continua valendo.
              </p>
            ) : (
              <p>Nada foi recebido ainda dessa venda.</p>
            )}
            {restoCorrecao > 0 && (
              <p>
                Fica a receber: <strong>{reais(restoCorrecao)}</strong>
                {vencResto ? ` até ${dataCurta(vencResto)}` : ''}.
              </p>
            )}
          </Resumo>
          {restoCorrecao > 0 && (
            <Pergunta rotulo="Quando paga o resto?" htmlFor="vencResto" erro={erros.vencResto}>
              <input
                id="vencResto"
                type="date"
                className="entrada"
                value={vencResto}
                onChange={(e) => setVencResto(e.target.value)}
              />
            </Pergunta>
          )}
        </>
      ) : (
        <Pagamento valor={pag} onChange={setPag} natureza="entrada" total={total} contraparte={cliente} erros={erros} />
      )}

      <div className={s.duas}>
        <Pergunta rotulo="Data da venda" htmlFor="data">
          <input id="data" type="date" className="entrada" value={data} max={hoje} onChange={(e) => setData(e.target.value || hoje)} />
        </Pergunta>
        <Pergunta rotulo="Observação" htmlFor="obs" opcional>
          <CampoTexto id="obs" valor={obs} onChange={setObs} maxLength={500} />
        </Pergunta>
      </div>

      {correcao && (
        <Pergunta rotulo="O que estava errado?" htmlFor="motivo" opcional ajuda="Fica anotado no histórico, junto com o original.">
          <CampoTexto id="motivo" valor={motivo} onChange={setMotivo} placeholder="Ex.: eram 3 chapas, não 2" maxLength={200} />
        </Pergunta>
      )}
    </Formulario>
  )
}
