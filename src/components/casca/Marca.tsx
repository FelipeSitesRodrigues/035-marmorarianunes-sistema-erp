import s from './casca.module.css'

/** O N da logo em mármore e o nome, como na logo, em versão pra fundo escuro. */
export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className={compacta ? s.marcaCompacta : s.marca}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marca/icone.png" alt="" width={240} height={265} className={s.marcaIcone} />
      <span className={s.marcaNome}>
        <span className={s.marcaLinha1}>Marmoraria</span>
        <span className={s.marcaLinha2}>Nunes</span>
      </span>
    </span>
  )
}
