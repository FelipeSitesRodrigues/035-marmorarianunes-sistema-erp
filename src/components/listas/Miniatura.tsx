import { Package, Wrench } from '@phosphor-icons/react/dist/ssr'

/**
 * Miniatura da pedra pras telas do servidor (o formulário tem a sua, no navegador).
 * Sem foto: insumo ganha a ferramenta, o resto a caixa (diferente do cubo de Cadastrar material).
 */
export function Miniatura({ foto, categoria, tamanho = 56 }: { foto: string | null; categoria?: string; tamanho?: number }) {
  if (!foto) {
    return (
      <span className="pedra pedra-icone" style={{ width: tamanho, height: tamanho }} aria-hidden>
        {categoria === 'Insumo' ? <Wrench /> : <Package />}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/pedras/${foto}.webp`}
      alt=""
      width={tamanho}
      height={tamanho}
      className="pedra"
      style={{ width: tamanho, height: tamanho }}
      loading="lazy"
    />
  )
}
