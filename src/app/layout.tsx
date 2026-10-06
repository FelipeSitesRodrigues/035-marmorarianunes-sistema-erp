import type { Metadata, Viewport } from 'next'
import { Archivo, Playfair_Display } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Marmoraria Nunes',
    template: '%s | Marmoraria Nunes',
  },
  description: 'Estoque e financeiro da Marmoraria Nunes.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#121212',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${archivo.variable}`}>
      <body>
        {/*
          THESIS: o sistema é a bancada da Val, não uma planilha: 5 botões de ação sempre à vista e o registro abrindo por cima, sem trocar de tela. Recusa o painel genérico de gráficos e siglas.
          OWN-WORLD: menu em mármore preto com o N da logo, área clara cor de papel, cartões brancos, mármore branco com faixa vermelha no saldo, miniatura da textura de cada pedra. Vermelho Nunes só na marca e na ação; âmbar avisa.
          STORY: a Val bate o olho e sabe quanto entrou, o que tem pra receber e qual pedra está acabando; registra uma venda em um painel só e vê o estoque mudar.
          FIRST VIEWPORT: saudação em Playfair e seletor de mês no topo; fileira de 5 ações; saldo do mês em mármore, contas em aberto e estoque lado a lado; últimas movimentações embaixo.
          FORM: mockup aprovado pelo Felipe (tela 1), sem rodada de direções.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        {children}
      </body>
    </html>
  )
}
