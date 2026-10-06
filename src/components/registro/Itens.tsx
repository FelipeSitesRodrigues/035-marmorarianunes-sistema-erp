'use client'

import { Plus, Trash } from '@phosphor-icons/react'
import { lerNumero, nomeUnidade, qtd, reais, valorCampo } from '@/lib/formatos'
import type { MaterialOpcao } from '@/lib/tipos'
import { CampoDinheiro, EscolhaMaterial, Quantidade } from './campos'
import s from './registro.module.css'

/*
 * As pedras de um registro. Começa com uma linha; "+ Outra pedra" acrescenta.
 * Embaixo de cada uma, o que vai acontecer com o estoque ("Depois ficam 12
 * chapas"), e o aviso em âmbar se a quantidade passa do que tem.
 */

export type Item = { chave: string; material: string | null; quantidade: string; valor: string; total: string }

export const itemVazio = (material: string | null = null): Item => ({
  chave: crypto.randomUUID(),
  material,
  quantidade: '1',
  valor: '',
  total: '',
})

/** Quanto sai de cada material somando as linhas (duas linhas da mesma pedra contam juntas). */
function somaPorMaterial(itens: Item[]) {
  const soma = new Map<string, number>()
  for (const i of itens) if (i.material) soma.set(i.material, (soma.get(i.material) ?? 0) + (lerNumero(i.quantidade) ?? 0))
  return soma
}

/** Problemas por linha: material, quantidade, estoque e preço. */
export function errosItens(itens: Item[], materiais: MaterialOpcao[], sentido: 'entrada' | 'saida') {
  const soma = somaPorMaterial(itens)
  const erros: Record<string, string> = {}
  itens.forEach((i, n) => {
    const m = materiais.find((x) => x.id === i.material)
    const q = lerNumero(i.quantidade)
    if (!m) erros[`item_${n}_material`] = 'Escolha a pedra ou o material.'
    else if (!q || q <= 0) erros[`item_${n}_qtd`] = 'A quantidade precisa ser maior que zero.'
    else if (sentido === 'saida' && (soma.get(m.id) ?? 0) > m.quantidade)
      erros[`item_${n}_qtd`] = `Só tem ${qtd(m.quantidade, m.unidade)} de ${m.nome} no estoque. Confira a quantidade.`
    else if (sentido === 'entrada' && lerNumero(i.valor) === null)
      erros[`item_${n}_valor`] = `Diga quanto custou cada ${nomeUnidade(m.unidade, 1)}.`
  })
  return erros
}

export function totalItens(itens: Item[]) {
  return itens.reduce((t, i) => t + Math.round((lerNumero(i.quantidade) ?? 0) * (lerNumero(i.valor) ?? 0) * 100) / 100, 0)
}

export function Itens({
  itens,
  onChange,
  materiais,
  sentido,
  erros,
  permitirVazio,
  rotuloMais,
  textoVazio,
}: {
  itens: Item[]
  onChange: (itens: Item[]) => void
  materiais: MaterialOpcao[]
  sentido: 'entrada' | 'saida'
  erros: Record<string, string | undefined>
  permitirVazio?: boolean
  rotuloMais: string
  textoVazio?: string
}) {
  const soma = somaPorMaterial(itens)
  const mudar = (n: number, parcial: Partial<Item>) => onChange(itens.map((i, k) => (k === n ? { ...i, ...parcial } : i)))

  return (
    <div className={s.itens}>
      {itens.length === 0 && textoVazio && <p className={s.itensVazio}>{textoVazio}</p>}

      {itens.map((item, n) => {
        const m = materiais.find((x) => x.id === item.material)
        const q = lerNumero(item.quantidade) ?? 0
        const somado = m ? (soma.get(m.id) ?? 0) : 0
        const depois = m ? (sentido === 'saida' ? m.quantidade - somado : m.quantidade + somado) : 0
        const erroQtd = erros[`item_${n}_qtd`]
        const erroMat = erros[`item_${n}_material`]
        const unitario = lerNumero(item.valor)

        return (
          <div key={item.chave} className={s.item}>
            <div className={s.itemTopo}>
              <EscolhaMaterial
                id={`item_${n}_material`}
                materiais={materiais}
                valor={item.material}
                onChange={(material) => mudar(n, { material })}
                invalido={!!erroMat}
              />
              {(itens.length > 1 || permitirVazio) && (
                <button
                  type="button"
                  className={s.itemTirar}
                  onClick={() => onChange(itens.filter((_, k) => k !== n))}
                  aria-label={m ? `Tirar ${m.nome}` : 'Tirar esta linha'}
                >
                  <Trash aria-hidden />
                </button>
              )}
            </div>
            {erroMat && <p className={s.erroCampo}>{erroMat}</p>}

            <div className={s.itemLinha}>
              <div className={s.itemCampo}>
                <label htmlFor={`item_${n}_qtd`} className={s.rotuloPequeno}>
                  {sentido === 'saida' ? 'Quantas?' : 'Quantas chegaram?'}
                </label>
                <Quantidade
                  id={`item_${n}_qtd`}
                  valor={item.quantidade}
                  onChange={(quantidade) => {
                    const novaQ = lerNumero(quantidade)
                    const total = novaQ && unitario !== null ? valorCampo(Math.round(novaQ * unitario * 100) / 100) : item.total
                    mudar(n, { quantidade, total })
                  }}
                  unidade={m?.unidade}
                  invalido={!!erroQtd}
                />
              </div>

              {sentido === 'entrada' && (
                <>
                  <div className={s.itemCampo}>
                    <label htmlFor={`item_${n}_valor`} className={s.rotuloPequeno}>
                      Valor por {m ? nomeUnidade(m.unidade, 1) : 'unidade'}
                    </label>
                    <CampoDinheiro
                      id={`item_${n}_valor`}
                      valor={item.valor}
                      invalido={!!erros[`item_${n}_valor`]}
                      onChange={(valor) => {
                        const v = lerNumero(valor)
                        mudar(n, { valor, total: v !== null && q ? valorCampo(Math.round(v * q * 100) / 100) : '' })
                      }}
                    />
                  </div>
                  <div className={s.itemCampo}>
                    <label htmlFor={`item_${n}_total`} className={s.rotuloPequeno}>
                      Total desta pedra
                    </label>
                    <CampoDinheiro
                      id={`item_${n}_total`}
                      valor={item.total}
                      onChange={(total) => {
                        const t = lerNumero(total)
                        mudar(n, { total, valor: t !== null && q ? valorCampo(Math.round((t / q) * 100) / 100) : item.valor })
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {erroQtd || erros[`item_${n}_valor`] ? (
              <p className={s.erroCampo}>{erroQtd ?? erros[`item_${n}_valor`]}</p>
            ) : (
              m &&
              q > 0 && (
                <p className={s.ajuda}>
                  {sentido === 'saida' ? 'Depois ' : 'Com essa compra '}
                  {depois === 1 ? 'fica' : 'ficam'} <strong>{qtd(depois, m.unidade)}</strong>
                  {sentido === 'saida' && m.estoque_minimo > 0 && depois <= m.estoque_minimo ? ', no mínimo ou abaixo dele.' : '.'}
                  {sentido === 'entrada' && unitario !== null && q > 0 ? ` ${qtd(q, m.unidade)} × ${reais(unitario)}.` : ''}
                </p>
              )
            )}
          </div>
        )
      })}

      <button type="button" className={s.maisItem} onClick={() => onChange([...itens, itemVazio()])}>
        <Plus weight="bold" aria-hidden />
        {rotuloMais}
      </button>
    </div>
  )
}
