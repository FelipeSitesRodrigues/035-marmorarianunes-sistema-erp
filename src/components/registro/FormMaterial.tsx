'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Package } from '@phosphor-icons/react'
import { cadastrarMaterial, editarMaterial } from '@/lib/acoes/registrar'
import { CATEGORIAS, lerNumero, nomeUnidade, numeroBR, reais, UNIDADES, type Categoria, type Unidade } from '@/lib/formatos'
import type { DadosMaterial, MaterialOpcao } from '@/lib/tipos'
import pedras from '../../../recursos/pedras.json'
import { useAviso } from './Aviso'
import { CampoDinheiro, CampoTexto, Fichas, Grupo, Pergunta, Quantidade, Resumo } from './campos'
import { sugestoes, type PropsForm } from './comum'
import { Formulario, mensagemDe, novaChave, useEnvio, useErros } from './Formulario'
import s from './registro.module.css'

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const UNIDADES_OPCOES = (Object.keys(UNIDADES) as Unidade[]).map((u) => ({ valor: u, rotulo: UNIDADES[u].nome }))

/** Cadastro de material novo e edição de um que já existe (sem mexer na quantidade). */
export function FormMaterial({
  contatos,
  hoje,
  onFechar,
  editando,
}: PropsForm & { editando?: MaterialOpcao | null }) {
  const { avisar } = useAviso()
  const router = useRouter()
  const [chave] = useState(novaChave)

  const [nome, setNome] = useState(editando?.nome ?? '')
  const [categoria, setCategoria] = useState<Categoria | null>(editando?.categoria ?? null)
  const [unidade, setUnidade] = useState<Unidade | null>(editando?.unidade ?? 'chapa')
  const [foto, setFoto] = useState<string | null>(editando?.foto ?? null)
  const [fotoEscolhida, setFotoEscolhida] = useState(!!editando)
  const [verFotos, setVerFotos] = useState(false)
  const [quantidade, setQuantidade] = useState('0')
  const [custo, setCusto] = useState('')
  const [minimo, setMinimo] = useState(editando ? numeroBR(editando.estoque_minimo) : '0')
  const [fornecedor, setFornecedor] = useState(editando?.fornecedor ?? '')
  const [obs, setObs] = useState(editando?.observacoes ?? '')

  const { erros, conferir } = useErros<string>()
  const { pendente, erro, enviar } = useEnvio()

  // Nome igual a uma pedra do catálogo do site: a foto vem sozinha
  const fotoSugerida = useMemo(() => pedras.find((p) => semAcento(p.nome) === semAcento(nome))?.slug ?? null, [nome])
  const fotoFinal = fotoEscolhida ? foto : (fotoSugerida ?? foto)

  const q = lerNumero(quantidade) ?? 0
  const c = lerNumero(custo)
  const u = unidade ?? 'chapa'

  function salvar() {
    const ok = conferir([
      ['nome', !nome.trim() && 'Diga o nome da pedra ou do material.'],
      ['categoria', !categoria && 'Escolha o tipo.'],
      ['unidade', !unidade && 'Escolha como conta esse material.'],
      ['quantidade', !editando && q < 0 && 'A quantidade não pode ser negativa.'],
      ['custo', !editando && q > 0 && c === null && `Diga quanto pagou por ${nomeUnidade(u, 1)}. Se não sabe, ponha 0.`],
    ] as [string, string | false | null][])
    if (!ok) return

    const dados: DadosMaterial = {
      chave,
      nome: nome.trim(),
      categoria: categoria!,
      unidade: u,
      quantidade_inicial: editando ? undefined : q,
      custo_unitario: editando ? undefined : (c ?? 0),
      estoque_minimo: lerNumero(minimo) ?? 0,
      fornecedor: fornecedor.trim(),
      observacoes: obs.trim(),
      foto: fotoFinal ?? undefined,
      data: hoje,
    }

    if (editando) {
      enviar(
        () => editarMaterial(editando.id, dados).then((r) => (r.ok ? { ok: true as const } : r)),
        () => {
          avisar({ titulo: 'Material atualizado.', linhas: [`${dados.nome} foi salvo.`], tom: 'ok' })
          onFechar()
          router.refresh()
        },
      )
      return
    }
    enviar(
      () => cadastrarMaterial(dados),
      (r) => {
        avisar({ ...mensagemDe(r.resumo!), tom: 'ok', operacaoId: r.resumo!.id, numero: r.resumo!.numero })
        onFechar()
      },
    )
  }

  return (
    <Formulario
      rotuloSalvar={editando ? 'Salvar alterações' : 'Cadastrar material'}
      pendente={pendente}
      erro={erro}
      onSalvar={salvar}
      onCancelar={onFechar}
    >
      <Pergunta rotulo="Nome da pedra ou do material" htmlFor="nome" erro={erros.nome}>
        <CampoTexto
          id="nome"
          valor={nome}
          onChange={setNome}
          sugestoes={editando ? undefined : pedras.map((p) => p.nome)}
          placeholder="Ex.: Verde Ubatuba"
          invalido={!!erros.nome}
          maxLength={80}
        />
      </Pergunta>

      <Grupo legenda="Tipo" erro={erros.categoria}>
        <div id="categoria" tabIndex={-1}>
          <Fichas nome="categoria" valor={categoria} onChange={setCategoria} opcoes={CATEGORIAS} />
        </div>
      </Grupo>

      <Grupo legenda="Foto" ajuda="Ajuda a reconhecer a pedra na lista. Pode deixar sem.">
        <div className={s.fotoAtual}>
          {fotoFinal ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/pedras/${fotoFinal}.webp`} alt="" width={64} height={64} className="pedra" />
          ) : (
            <span className="pedra pedra-icone" style={{ width: 64, height: 64 }} aria-hidden>
              <Package />
            </span>
          )}
          <span>{fotoFinal ? pedras.find((p) => p.slug === fotoFinal)?.nome : 'Sem foto'}</span>
          <button type="button" className="botao botao-pequeno" onClick={() => setVerFotos((v) => !v)} aria-expanded={verFotos}>
            {verFotos ? 'Fechar fotos' : 'Escolher foto'}
          </button>
        </div>
        {verFotos && (
          <div className={s.fotos}>
            <button
              type="button"
              className={s.fotoOpcao}
              aria-pressed={!fotoFinal}
              onClick={() => {
                setFoto(null)
                setFotoEscolhida(true)
                setVerFotos(false)
              }}
            >
              <span className="pedra pedra-icone" aria-hidden>
                <Package />
              </span>
              Sem foto
            </button>
            {pedras.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={s.fotoOpcao}
                aria-pressed={fotoFinal === p.slug}
                onClick={() => {
                  setFoto(p.slug)
                  setFotoEscolhida(true)
                  setVerFotos(false)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/pedras/${p.slug}.webp`} alt="" width={56} height={56} className="pedra" loading="lazy" />
                {p.nome}
                {fotoFinal === p.slug && <Check weight="bold" className={s.fotoMarca} aria-hidden />}
              </button>
            ))}
          </div>
        )}
      </Grupo>

      <Grupo
        legenda="Como você conta esse material?"
        erro={erros.unidade}
        ajuda={editando ? 'Depois da primeira entrada ou saída, a unidade não muda mais.' : undefined}
      >
        <div id="unidade" tabIndex={-1}>
          <Fichas nome="unidade" valor={unidade} onChange={setUnidade} opcoes={UNIDADES_OPCOES} />
        </div>
      </Grupo>

      {!editando && (
        <>
          <Pergunta rotulo="Quanto tem hoje no estoque?" htmlFor="quantidade" erro={erros.quantidade}>
            <Quantidade id="quantidade" valor={quantidade} onChange={setQuantidade} unidade={u} />
          </Pergunta>
          {q > 0 && (
            <Pergunta rotulo={`Quanto pagou por ${nomeUnidade(u, 1)}?`} htmlFor="custo" erro={erros.custo} ajuda="Se não lembra, ponha um valor aproximado. Ele entra no valor do estoque.">
              <CampoDinheiro id="custo" valor={custo} onChange={setCusto} invalido={!!erros.custo} />
            </Pergunta>
          )}
          {q > 0 && (
            <Resumo>
              <p>
                Entra no estoque com <strong>{numeroBR(q)} {nomeUnidade(u, q)}</strong>
                {c ? (
                  <>
                    , <strong>{reais(Math.round(q * c * 100) / 100)}</strong> em pedra
                  </>
                ) : null}
                . O caixa não mexe: compra nova se registra em Registrar compra.
              </p>
            </Resumo>
          )}
        </>
      )}

      <Pergunta
        rotulo="Avisar quando ficar com"
        htmlFor="minimo"
        ajuda={
          lerNumero(minimo)
            ? `Com ${numeroBR(lerNumero(minimo)!)} ${nomeUnidade(u, lerNumero(minimo)!)} ou menos, a pedra aparece em "Precisa repor".`
            : 'Em zero, não avisa. Ponha a quantidade em que você costuma comprar de novo.'
        }
      >
        <Quantidade id="minimo" valor={minimo} onChange={setMinimo} unidade={u} rotulo="Estoque mínimo" />
      </Pergunta>

      <div className={s.duas}>
        <Pergunta rotulo="Fornecedor" htmlFor="fornecedor" opcional>
          <CampoTexto id="fornecedor" valor={fornecedor} onChange={setFornecedor} sugestoes={sugestoes(contatos.fornecedores)} />
        </Pergunta>
        <Pergunta rotulo="Observação" htmlFor="obs" opcional>
          <CampoTexto id="obs" valor={obs} onChange={setObs} maxLength={500} />
        </Pergunta>
      </div>

      {editando && (
        <p className={s.explicacao}>
          A quantidade não muda por aqui. Pra acertar o que tem no pátio, use <strong>Ajustar estoque</strong> na página
          da pedra. Custo médio hoje: {reais(editando.custo_medio)} por {nomeUnidade(editando.unidade, 1)}.
        </p>
      )}
    </Formulario>
  )
}
