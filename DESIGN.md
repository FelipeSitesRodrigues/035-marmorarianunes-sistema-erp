---
name: Sistema Marmoraria Nunes
description: A bancada da Val. Estoque e financeiro de uma marmoraria de Irecê, em mármore e no vermelho da marca.
colors:
  vermelho: "#b01522"
  vermelho-escuro: "#8e1019"
  vermelho-claro: "#fbecee"
  grafite: "#16171a"
  texto: "#2e2c29"
  texto-suave: "#5d5952"
  papel: "#f6f5f2"
  branco: "#ffffff"
  veio: "#e8e5df"
  veio-forte: "#d4cfc6"
  neutro-claro: "#f0eeea"
  menu: "#121212"
  menu-texto: "#f4f2ee"
  marmore-base: "#f3f2ef"
  verde: "#1e7a4c"
  verde-claro: "#e8f3ec"
  ambar: "#9a5f0c"
  ambar-claro: "#fbf1de"
  ambar-borda: "#f0dcb2"
  areia: "#f4ede2"
  areia-texto: "#6a5435"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.25rem, 1.4rem + 2.2vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: '"lnum", "pnum"'
  display-valor:
    fontFamily: "Playfair Display, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.6rem, 1.6rem + 2.4vw, 4.1rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: '"lnum", "pnum"'
  headline:
    fontFamily: "Playfair Display, Georgia, 'Times New Roman', serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontFeature: '"lnum", "pnum"'
  valor:
    fontFamily: "Playfair Display, Georgia, 'Times New Roman', serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    fontFeature: '"lnum", "pnum"'
  title:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: '"tnum"'
  numero:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.5
    fontFeature: '"tnum"'
  label:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  pedra: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  folha: "20px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "28px"
  gutter-celular: "16px"
  gutter-computador: "32px"
components:
  button-primary:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.branco}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.vermelho-escuro}"
  button-secondary:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "52px"
  button-small:
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  button-disabled:
    backgroundColor: "{colors.neutro-claro}"
    textColor: "#8a857c"
  input:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    height: "52px"
  input-money-large:
    height: "60px"
  card:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.lg}"
    padding: "18px"
  action-card:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.lg}"
    padding: "14px 36px 14px 16px"
  option-card:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.lg}"
    padding: "12px 14px 12px 44px"
    height: "64px"
  option-card-selected:
    backgroundColor: "#fff8f8"
  chip:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.texto}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.branco}"
  tag:
    backgroundColor: "{colors.neutro-claro}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  tag-verde:
    backgroundColor: "{colors.verde-claro}"
    textColor: "{colors.verde}"
  tag-ambar:
    backgroundColor: "{colors.ambar-claro}"
    textColor: "{colors.ambar}"
  tag-venda:
    backgroundColor: "{colors.vermelho-claro}"
    textColor: "{colors.vermelho-escuro}"
  tag-saida:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.areia-texto}"
  tag-cinza:
    backgroundColor: "{colors.neutro-claro}"
    textColor: "{colors.texto-suave}"
  selo:
    backgroundColor: "{colors.vermelho-claro}"
    textColor: "{colors.vermelho}"
    rounded: "{rounded.pill}"
    size: "48px"
  stone-thumb:
    backgroundColor: "{colors.neutro-claro}"
    rounded: "{rounded.pedra}"
    size: "56px"
  nav-sidebar:
    backgroundColor: "{colors.menu}"
    textColor: "{colors.menu-texto}"
    width: "252px"
  nav-item:
    textColor: "{colors.menu-texto}"
    padding: "0 24px 0 30px"
    height: "60px"
  nav-item-active:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.branco}"
  bottom-bar:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.texto-suave}"
    height: "72px"
  month-selector:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.md}"
    height: "52px"
  balance-card:
    backgroundColor: "{colors.marmore-base}"
    textColor: "{colors.grafite}"
    padding: "22px 26px"
  side-panel:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.texto}"
    width: "600px"
  mobile-sheet:
    backgroundColor: "{colors.branco}"
    rounded: "{rounded.folha}"
  toast:
    backgroundColor: "{colors.grafite}"
    textColor: "{colors.menu-texto}"
    rounded: "{rounded.xl}"
    padding: "16px 14px 16px 16px"
---

# Design System: Sistema Marmoraria Nunes

## Overview

**Creative North Star: "A Bancada da Val"**

O sistema é a bancada de atendimento da Marmoraria Nunes passada pra tela: uma superfície clara cor de papel onde a Val trabalha, emoldurada por mármore preto à esquerda, com a pedra sempre à vista. Não é planilha nem painel de indicadores. Cinco ações escritas por extenso ficam sempre ao alcance, e registrar abre um painel por cima da tela atual, sem trocar de página. Os números aparecem escritos e com rótulo do dia a dia ("Entrou", "Saiu", "A receber"), nunca como gráfico ou sigla.

A matéria do mundo é a da loja. Mármore preto texturizado na casca (menu, topo do celular, tela de entrar), mármore branco só onde mora o saldo, e cada pedra identificada pela miniatura da própria textura antes do nome. O vermelho da letra N da logo entra em dose medida: na marca, no item ativo, na escolha marcada e na ação principal, e uma única vez como matéria, na faixa diagonal que corta o mármore do saldo no Início. O resto é papel, branco e grafite.

A densidade é de ferramenta de balcão pra quem tem pouca prática digital: texto de 17 px, alvos de 44 a 60 px, opções grandes com nome escrito, contraste AA em tudo. A hierarquia vem do contraste entre a serifada da marca (Playfair Display) nos títulos e nos valores grandes e uma sem serifa de trabalho (Archivo) em tudo que se lê e se clica, não de cor.

**Key Characteristics:**
- Casca em mármore preto com a logo, área de trabalho cor de papel, cartões brancos com borda de veio e sombra quase ambiente.
- Vermelho Nunes só pra marca e ação; âmbar avisa; verde é dinheiro que entrou; grafite é dinheiro que saiu.
- Playfair nos títulos e no número grande de cada cartão, sempre com algarismos alinhados; Archivo em tudo que se lê e se clica.
- Cinco ações sempre à vista e registro num painel lateral por cima da tela.
- Pedra reconhecida pela textura: miniatura em toda lista que cita material.

## Colors

Uma paleta de pedra e papel, quente e quase sem saturação, onde o único acento forte é o vermelho da logo e a cor de estado fala por verde e âmbar.

### Primary
- **Vermelho Nunes** (#b01522): a cor da letra N. Botão principal ("Salvar venda"), item ativo do menu (em degradê pro Vermelho Dobra), botão central "Registrar" da barra do celular, avatar, ficha e opção marcadas, link de ação em itálico, cursor de texto e anel de foco (a 45% de opacidade). Também é a matéria da faixa diagonal do saldo.
- **Vermelho Dobra** (#8e1019): hover e pressão do botão principal, fim do degradê do item ativo, texto da etiqueta "Venda" e da seleção de texto.
- **Rosa Selo** (#fbecee): fundo do selo redondo que segura o ícone de cada ação, da etiqueta "Venda", da seleção de texto e da pedra escolhida na busca.

### Secondary
- **Verde Caixa** (#1e7a4c) sobre **Verde Recibo** (#e8f3ec): dinheiro que entrou ("Entrou R$ 16.050,00"), conta paga, uso na obra registrado, estoque em dia, resumo de confirmação que deu certo. O verde não enfeita: só aparece quando o dinheiro chegou ou a situação está resolvida.

### Tertiary
- **Âmbar Aviso** (#9a5f0c) sobre **Âmbar Claro** (#fbf1de), com **Borda Âmbar** (#f0dcb2): tudo que pede atenção. Conta a receber ou atrasada, "4 precisam de reposição", estoque abaixo do mínimo, campo inválido, erro do formulário, aviso de correção e saldo negativo. Sempre acompanhado de palavra ("1 atrasado", "vence amanhã"), nunca só a cor.

### Neutral
- **Grafite Pedra** (#16171a): títulos, valores em destaque, dinheiro que saiu, texto de botão secundário e fundo do aviso de confirmação.
- **Tinta Quente** (#2e2c29): texto corrido.
- **Pó de Granito** (#5d5952): texto secundário, legendas, ícones em repouso, item inativo da barra do celular.
- **Papel da Bancada** (#f6f5f2): fundo da área de trabalho, hover de linha, caixas de explicação e de resumo dentro do painel.
- **Branco Cartão** (#ffffff): cartões, campos, botões secundários, painel lateral e barra do celular.
- **Veio Claro** (#e8e5df): bordas de cartão e divisórias entre linhas.
- **Veio Forte** (#d4cfc6): borda de campo, botão, ficha e opção em repouso; barra de rolagem.
- **Pedra Lavada** (#f0eeea): etiqueta neutra, botão desabilitado, botão de fechar redondo, fundo da miniatura enquanto a foto carrega.
- **Mármore Preto** (#121212): base da casca (menu, topo do celular, tela de entrar), sempre por baixo da textura escura; também é a cor de tema do navegador.
- **Giz** (#f4f2ee): texto sobre o mármore preto e sobre o aviso de confirmação.
- **Mármore Branco** (#f3f2ef): cor de base sob a textura de mármore claro do saldo, pra o cartão não piscar vazio enquanto a imagem chega.
- **Areia de Obra** (#f4ede2) com **Terra** (#6a5435): a etiqueta de tipo das saídas de pedra ("Saída para obra"), pra separar movimento de pedra de movimento de dinheiro na lista.

### Named Rules
**The Red Never Warns Rule.** O vermelho Nunes é marca, escolha e ação. Atraso, falta de estoque, erro e saldo negativo são âmbar, sempre escritos em palavra. Se algo está errado e aparece em vermelho, está errado duas vezes.

**The Money Has a Color Rule.** Dinheiro que entrou é verde. Dinheiro que saiu é grafite, marcado por seta pra baixo (no saldo do mês) ou pelo sinal de menos tipográfico, "−" (nas listas do Financeiro e na movimentação do material), nunca por vermelho. A lista de últimas movimentações do Início não leva sinal: o tipo na etiqueta já diz o sentido.

**The Marble Means Balance Rule.** A textura de mármore branco é reservada ao saldo do mês (Início, Financeiro e Relatórios). A faixa vermelha cortada do N da logo aparece só no saldo do Início. O mármore preto é só a casca. Cartão comum é branco liso.

## Typography

**Display Font:** Playfair Display, pesos 700 e 800 com itálico (com Georgia de reserva)
**Body Font:** Archivo (com system-ui de reserva)

**Character:** a serifada de alto contraste da marca dá voz de loja tradicional aos títulos e aos números que importam; a Archivo, larga e firme, carrega o trabalho de ler rótulo, preencher campo e apertar botão sem cansar.

### Hierarchy
- **Display** (Playfair 800, clamp(2.25rem, 1.4rem + 2.2vw, 3.4rem), 1.05): a saudação "Boa tarde, Val" e o título de cada tela.
- **Display Valor** (Playfair 800, clamp(2.6rem, 1.6rem + 2.4vw, 4.1rem), 1.05): o saldo do mês, um por tela.
- **Headline** (Playfair 700, 1.5rem, 1.15): título de seção e de cartão ("O que você quer fazer?", "Contas em aberto", "Estoque"). O título do painel de registro sobe pra 1.75rem.
- **Valor** (Playfair 700, 1.5rem, 1.15): o número principal de um cartão ou conta ("R$ 14.800,00 a receber"); o total do formulário sobe pra 1.625rem.
- **Title** (Archivo 600, 1.125rem, 1.2): nome da ação no cartão ("Registrar venda"), nome da pedra na lista, rótulo de pergunta do formulário (a 1.0625rem).
- **Body** (Archivo 400, 1.0625rem, 1.5): texto corrido, descrições de movimentação (até duas linhas, nunca reticências no nome do cliente), conteúdo de campo e de botão (botão a 600).
- **Número** (Archivo 700, 1.0625rem, algarismos tabulares): valores em linha e coluna ("R$ 1.650,00" na lista, "Saiu R$ 10.350,00" no saldo a 1.5rem).
- **Label** (Archivo 500, 0.9375rem, 1.3): etiquetas, ajudas, legendas, data da linha, descrição da ação. É o menor tamanho do sistema.
- **Link de ação** (Playfair 700 itálico, 1.0625rem, vermelho Nunes): "Ver no Financeiro", "Ver histórico completo". Sublinha no hover, com 4 px de afastamento.

### Named Rules
**The Lining Figures Rule.** A Playfair vem com algarismos antigos; todo número em Playfair leva `lining-nums proportional-nums`, e todo número em Archivo leva algarismos tabulares (é o padrão do corpo). Valor com "5" descendo da linha está quebrado.

**The Two Numbers Rule.** O número grande que resume um cartão é Playfair; o número que divide linha ou coluna com outros números é Archivo em negrito. Um cartão tem no máximo um número em Playfair de destaque.

**The Fifteen Pixel Floor Rule.** O corpo é 17 px (1.0625rem) e nada desce de 15 px (0.9375rem). Se não cabe a 15 px, o texto muda, o tamanho não.

## Layout

No computador, a casca é uma grade de duas colunas: menu fixo de 252 px em mármore preto (a faixa escura desce junto com a página por um degradê no fundo da casca) e a área de trabalho com 28 px no topo, 32 px nas laterais e 48 px no pé, com conteúdo limitado a 1500 px. A tela é uma pilha vertical com 18 px entre blocos.

O primeiro quadro do Início segue o mockup aprovado: saudação e data à esquerda com o seletor de mês à direita; a fileira das cinco ações (cinco colunas iguais com 14 px de vão); três blocos lado a lado na proporção 1.6 / 1 / 1.05 (saldo em mármore, contas em aberto, estoque); e as últimas movimentações embaixo, numa linha de cinco colunas (tipo, quando, descrição, valor, situação).

O ritmo de espaço anda em passos pares de 2 px entre 6 e 32: 6 px entre ícone e texto de etiqueta, 10 a 14 px dentro de componente, 18 px de respiro interno de cartão e entre blocos, 28 px nas margens do painel lateral.

Responsivo, nas larguras em que o sistema muda:
- **1200 a 1499 px**: as ações ficam numa fileira só (1366x768 é a tela comum de computador de loja), com texto e respiro mais curtos; o rodapé do saldo perde os ícones e mantém o número inteiro.
- **960 a 1199 px**: ações em 3 + 2, saldo em largura cheia e contas e estoque em duas colunas.
- **Abaixo de 1280 px**: a linha de movimentação vira duas fileiras, com a descrição ocupando o meio.
- **Abaixo de 960 px**: sai o menu, entra um topo escuro de 60 px com a logo compacta e uma barra fixa embaixo de 72 px (mais a área segura) com cinco vagas e o botão "Registrar" redondo e vermelho no meio, saltado 26 px pra cima. Ações em 2 + 2 + 1, blocos empilhados, gutter de 16 px, e o painel de registro ocupa a tela toda.
- **Abaixo de 640 px**: a linha de movimentação vira três fileiras (tipo e valor; descrição; quando e situação), o seletor de mês ocupa a largura toda e as perguntas do formulário empilham numa coluna (abaixo de 600 px).

### Named Rules
**The Five Actions Rule.** As cinco ações de registro (venda, compra, saída, despesa, material) estão sempre à vista: em cartões no topo do Início no computador e atrás do "Registrar" da barra no celular. Nenhuma fica escondida em menu de três pontos.

**The Panel Over the Page Rule.** Registrar nunca troca de tela. O formulário abre num painel lateral de 600 px por cima do que a Val estava vendo (tela cheia no celular), e a confirmação aparece por cima também, dizendo o que mudou no estoque.

## Elevation & Depth

Híbrido e contido. A profundidade vem primeiro do material (o mármore preto atrás, o papel no meio, o cartão branco em cima) e da borda de veio; a sombra é quase ambiente e só cresce quando algo cobre o trabalho. A única sombra de cor é o brilho vermelho embaixo do botão principal, do item ativo do menu e do botão "Registrar", que faz o vermelho parecer apertável.

### Shadow Vocabulary
- **Repouso** (`box-shadow: 0 1px 2px rgb(22 23 26 / 4%), 0 6px 18px rgb(22 23 26 / 5%)`): todo cartão, o seletor de mês.
- **Erguido** (`box-shadow: 0 2px 6px rgb(22 23 26 / 6%), 0 14px 32px rgb(22 23 26 / 8%)`): cartão de ação no hover, junto com a subida de 2 px.
- **Por cima** (`box-shadow: 0 24px 64px rgb(22 23 26 / 22%)`): painel lateral, folha do celular, aviso de confirmação, cartão de entrar.
- **Brilho da ação** (`box-shadow: 0 1px 2px rgb(142 16 25 / 25%), 0 6px 16px rgb(176 21 34 / 18%)`): botão principal. O item ativo do menu e o "Registrar" do celular usam a versão forte, `0 8px 22px rgb(176 21 34 / 35%)`.
- **Dobra da fita** (`box-shadow: -3px 6px 14px rgb(60 0 6 / 32%)`): só a faixa vermelha do saldo, com um degradê de dobra nas bordas da própria fita.

### Named Rules
**The Paper Rests Rule.** Cartão fica parado e quase sem sombra. Só o cartão de ação sobe no hover (2 px, sombra Erguido). Sombra Por cima é exclusiva do que cobre a tela.

## Shapes

Cantos de pedra polida: arredondados o bastante pra parecer amigável, nunca balão. Cartões e opções a 12 px, botões e campos a 10 px, botão pequeno e linha de lista a 8 px, miniatura da pedra a 6 px (é uma amostra cortada, quase reta), item de pedra dentro do formulário e aviso de confirmação a 14 px, folha do celular a 20 px só no topo. Etiquetas e fichas são cápsulas completas; selo, avatar, botão de fechar e "Registrar" são círculos.

Duas formas são da casa. O item ativo do menu é colado na borda esquerda e arredondado só à direita (0 12px 12px 0), como uma aba saindo do mármore; a aba branca translúcida com o título "Como está outubro" repete esse corte por cima do saldo. E a faixa vermelha do saldo é um retângulo de 52 px girado a −45° e cortado pelo canto do cartão, tirada da faixa do N da logo. Bordas são de 1 px em veio; opções, fichas e o botão de "mais uma pedra" usam 1.5 px, tracejado quando é lugar vazio a preencher.

## Components

### Buttons
Grandes, firmes e com nome escrito; o ícone ajuda, o texto manda.
- **Shape:** cantos suaves (10px), altura mínima de 52 px, ícone de 22 px com 10 px de vão.
- **Primary:** fundo vermelho Nunes, texto branco em Archivo 600 a 1.0625rem, padding de 22 px nas laterais, com o brilho da ação. Um por tela ou painel ("Salvar venda").
- **Hover / Focus:** o principal escurece pro Vermelho Dobra; o secundário troca a borda de veio por grafite. Ao apertar, desce 1 px. Foco é anel de 3 px em vermelho a 45%, afastado 2 px.
- **Secondary:** fundo branco, borda Veio Forte, texto grafite ("Cancelar", "Fechar", "Imprimir ou salvar em PDF").
- **Small:** 40 px de altura, 14 px de padding, cantos de 8 px, texto a 0.9375rem.
- **Disabled:** fundo Pedra Lavada, borda Veio Claro, texto apagado, sem sombra e sem movimento.
- **Link de ação:** Playfair itálico vermelho com chevron, pra "ver mais" no pé de cartão.

### Chips
- **Style:** cápsula de 44 px de altura, fundo branco, borda Veio Forte de 1.5 px, Archivo 500.
- **State:** marcada vira vermelho Nunes cheio com texto branco. Os filtros do estoque são a mesma cápsula, mas a marcada vira grafite cheio; o filtro "Precisa repor" fica em âmbar e vira âmbar cheio quando marcado.

### Etiquetas
Cápsulas de 15 px em Archivo 500, sem borda, com ícone opcional de 16 px. Duas famílias com a mesma forma: **tipo** (Venda em Rosa Selo com texto Vermelho Dobra; Saída em Areia com texto Terra; Compra, Despesa, Cadastro e Ajuste em Pedra Lavada) e **situação** (Verde Recibo pra pago, em dia e usado na obra; Âmbar pra a receber, atrasado e precisa repor; cinza pra cancelado e corrigido).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** branco, sobre o papel da bancada.
- **Shadow Strategy:** sombra Repouso (ver Elevation & Depth).
- **Border:** 1 px em Veio Claro.
- **Internal Padding:** 18 px; 16 px no celular. Contas dentro de cartão são caixas de 12 px de padding com borda de veio, sem sombra.

### Inputs / Fields
- **Style:** 52 px de altura, fundo branco, borda Veio Forte de 1 px, cantos de 10 px, texto grafite a 17 px, placeholder em cinza quente com contraste AA. Rótulo sempre escrito em cima, como pergunta ("Para quem?", "Valor total da venda"), com "(opcional)" em peso normal.
- **Focus:** borda vermelha e halo de 3 px em vermelho a 14%.
- **Error / Disabled:** campo inválido troca pra borda e halo âmbar, com a mensagem âmbar embaixo e ícone de aviso. Erro geral do formulário é uma caixa âmbar no rodapé do painel.
- **Dinheiro:** o "R$" fica preso dentro do campo à esquerda, o valor em 600; o campo do valor total cresce pra 60 px e 1.375rem.
- **Quantidade:** botões de menos e mais de 52 px nos lados de um campo centrado de 96 px, com a unidade escrita ao lado ("chapas", "m²").

### Navigation
- **Menu lateral (computador):** mármore preto texturizado escurecendo pra baixo, logo N de 92 px com a palavra MARMORARIA em giz e NUNES em vermelho claro entre dois fios. Itens de 60 px em Archivo 500 a 1.1875rem com ícone de 28 px; hover clareia 7%; o ativo é a aba vermelha em degradê com brilho. No pé, o avatar vermelho com o nome e o "Sair", separados por um fio de 16% de branco.
- **Barra do celular:** branca, fixa embaixo, cinco vagas com ícone de 26 px e rótulo escrito; a ativa fica vermelha em 600. A vaga do meio é o "Registrar", um círculo vermelho de 52 px saltado pra fora da barra e contornado de branco, que abre uma folha de baixo com as cinco ações.
- **Seletor de mês:** caixa branca de 52 px com setas de 48 px nas pontas e o mês escrito por extenso no meio.

### Cartão de ação
O coração da tese. Cartão branco com o selo redondo de 52 px (ícone vermelho sobre Rosa Selo), o nome da ação em Archivo 600 e uma linha de explicação em Pó de Granito ("Vendeu pedra ou peça pra um cliente"), com o chevron no canto. No hover, a borda esquenta pro rosa, a sombra cresce e o cartão sobe 2 px.

### Saldo em mármore
O cartão assinatura. A parte de cima é mármore branco de verdade (textura com véu branco de 10 a 30%), com a aba branca do título colada na borda esquerda, o rótulo "Saldo do mês", o saldo em Display Valor e as linhas "Entrou" (verde, seta pra cima) e "Saiu" (grafite, seta pra baixo). No Início, a fita vermelha do N cruza o canto superior direito. Embaixo, um rodapé branco em três colunas separadas por veio (Vendido, Comprado, Despesas). Saldo negativo vira âmbar.

### Miniatura da pedra
Toda lista que cita material mostra a foto da textura daquela pedra em 56 px (cantos de 6 px, contorno interno de 8% de grafite), porque a Val reconhece a pedra antes de ler o nome. Material sem foto (disco de corte, cuba, massa) ganha um ladrilho Pedra Lavada com ícone.

### Opção grande
As perguntas de escolha do formulário viram cartões de 64 px com bolinha à esquerda, título em 600 e descrição opcional ("Não, só serviço / Mão de obra, polimento, instalação"). Marcada: borda vermelha, fundo rosado quase branco e bolinha vermelha cheia com visto branco. Em três colunas (ou duas) no computador, empilhadas no celular.

### Painel de registro
Diálogo nativo encostado à direita, 600 px de largura e altura toda, com fundo escurecido a 46% atrás. Topo com título em Playfair e botão "Fechar" escrito; corpo rolável com perguntas a 26 px de distância; rodapé fixo com o botão principal largo e o "Cancelar" ao lado. Entra deslizando 32 px da direita com fade em 0.26 s; no celular sobe 32 px de baixo.

### Aviso de confirmação
Cartão grafite no canto inferior direito (acima da barra no celular), cantos de 14 px, com visto verde-claro, título em branco ("Venda salva.") e as linhas do que mudou em giz ("Verde Ubatuba agora tem 18 chapas.", "Entrou R$ 2.100,00 no caixa."), mais botões pequenos translúcidos ("Desfazer", "Ver lançamento"). Erro troca o ícone pra âmbar claro. Sobe 16 px com fade em 0.28 s.

## Do's and Don'ts

### Do:
- **Do** reservar o vermelho Nunes (#b01522) pra marca, item ativo, escolha marcada, link de ação e um botão principal por tela ou painel.
- **Do** escrever todo aviso em palavras e pintar em âmbar (#9a5f0c sobre #fbf1de): "1 atrasado", "vence amanhã", "4 precisam de reposição".
- **Do** mostrar dinheiro que entrou em verde (#1e7a4c) e dinheiro que saiu em grafite (#16171a), com seta ou com o sinal "−" tipográfico.
- **Do** ligar `lining-nums proportional-nums` em todo número em Playfair e manter algarismos tabulares nos números em Archivo.
- **Do** pôr a miniatura da textura (56 px, cantos de 6 px) ao lado de toda pedra listada, e o ladrilho com ícone quando não há foto.
- **Do** abrir todo registro no painel lateral de 600 px por cima da tela atual, com rodapé fixo de "Salvar" e "Cancelar", e confirmar no aviso grafite o que mudou no estoque.
- **Do** manter alvos de toque de 44 px ou mais (botões e campos de 52 px, itens de menu de 60 px) e corpo de 17 px.
- **Do** respeitar `prefers-reduced-motion`: só se move o que comunica estado (painel entrando, aviso subindo, cartão de ação erguendo), com a curva `cubic-bezier(0.22, 0.61, 0.36, 1)`.

### Don't:
- **Don't** usar o vermelho da marca pra atraso, erro, falta de estoque, saldo negativo ou dinheiro que saiu.
- **Don't** usar a textura de mármore branco em cartão que não seja o saldo do mês, nem repetir a fita vermelha fora do saldo do Início.
- **Don't** trocar número escrito por gráfico, indicador ou sigla; o relatório é tabela com rótulo do dia a dia ("Vendida", "Usada em obra", "Precisa repor").
- **Don't** deixar ação só com ícone; os únicos ícones sozinhos são o fechar (X) e o menos e mais da quantidade.
- **Don't** usar Playfair em campo, botão, etiqueta ou texto corrido; ela é título, valor de destaque e link de ação.
- **Don't** pôr texto abaixo de 15 px (0.9375rem).
- **Don't** mandar a Val pra outra página pra registrar algo, nem esconder uma das cinco ações em menu.
