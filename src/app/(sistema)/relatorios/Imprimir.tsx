'use client'

import { Printer } from '@phosphor-icons/react'

export function Imprimir() {
  return (
    <button type="button" className="botao" onClick={() => window.print()}>
      <Printer aria-hidden />
      Imprimir ou salvar em PDF
    </button>
  )
}
