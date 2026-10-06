# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) com CSS Modules, Postgres direto pelo pacote `postgres`, login próprio
(scrypt e sessão no banco). Banco no projeto do Supabase da Nobre Estofados (070), num schema
próprio (`nunes`). Hospedagem na Vercel. Decidido pelo Felipe seguindo a regra do MazyOS
(projeto com banco, login e painel vai de Next) e a divisão do banco foi pedido dele em 2026-10-06.

## Users

A Val, dona da Marmoraria Nunes em Irecê-BA, que tem pouca prática com tecnologia. É a única
usuária (um login). Usa principalmente o computador da loja; o celular precisa funcionar
completo, mas vem em segundo lugar. O trabalho dela no sistema: registrar o que entra e sai de
pedra, o que vende, o que compra e o que paga, e saber quanto tem, quanto entrou e o que está
pra receber e pagar.

## Product Purpose

Controle de estoque e financeiro da loja num lugar só (escopo completo em
`sites/035 - Marmoraria Nunes Irecê/sistema/escopo.md`). Sucesso: a Val registra uma venda ou
uma saída em poucos passos sem ajuda, confia nos números do mês e vê a tempo qual pedra está
acabando.

## Positioning

Feito pra uma marmoraria de verdade, não um ERP genérico: a pedra é reconhecida pela foto da
textura, a unidade é a do pátio (chapa, m², metro), a venda pode ser só de serviço, e o sinal
com o restante a receber (o jeito comum de vender bancada) é uma resposta só no formulário.

## Operating Context

Loja física em Irecê, bancada de atendimento com um computador. Compras chegam do fornecedor
em chapas; peças saem pra obra antes de a venda fechar; cliente costuma dar sinal e pagar o
resto na entrega. Fuso de Irecê (America/Bahia) em todas as datas.

## Capabilities and Constraints

- Cadastro de pedras e materiais com estoque inicial (sem mexer no caixa), mínimo e foto.
- Compra soma no estoque e lança o pagamento (pago, parte ou depois); venda e saída descontam;
  saída por obra, perda e descarte não mexe no dinheiro; venda a prazo vira "a receber".
- Estoque nunca fica negativo, clique duplo não duplica, correção guarda o original, cancelar
  desfaz o efeito, e o histórico não se apaga (regras no banco, com testes).
- Relatórios por dia, semana e mês, com impressão em PDF.
- Sem "esqueci a senha": a senha nova sai pelo Felipe (`scripts/acesso.mjs`).
- Indefinido: domínio próprio; plano da Vercel (Hobby proíbe uso comercial, decidir na publicação).

## Brand Commitments

Identidade da Marmoraria Nunes já existente no site (035): vermelho `#B01522`, Playfair Display
e Archivo, logo da letra N em mármore com a faixa vermelha. **O mockup aprovado pelo Felipe
(`sites/035 - Marmoraria Nunes Irecê/sistema/mockup/tela-1-inicio.png`) é a autoridade da
direção visual**: ele fixou o mundo antes do código, então não houve rodada de conceitos. As
outras telas foram construídas dentro desse mesmo mundo.
Português do Brasil, linguagem do dia a dia ("Entrou", "Saiu", "A receber"), sem sigla.

## Evidence on Hand

Fotos reais de 28 pedras do catálogo do site (`recursos/pedras/`), logo (`recursos/marca/`).
Os números das telas de desenvolvimento são de demonstração (`scripts/semear-demo.mjs`), nunca
da loja. O estoque real da Val ainda não foi cadastrado.

## Product Principles

1. A Val entende sem ninguém explicar: toda ação tem nome escrito, toda escolha é um botão grande.
2. Registrar é rápido e acontece por cima da tela atual, sem navegar.
3. Antes de salvar, o formulário mostra o que vai acontecer; depois, confirma o que mudou.
4. Estoque e dinheiro andam juntos sem se confundir: pedra usada não é despesa, venda a prazo não é dinheiro no caixa.
5. Nada some: erro se corrige ou cancela, e o histórico guarda os dois.

## Accessibility & Inclusion

Usuária com pouca prática digital e provavelmente com leitura cansada: texto de 17 px, nada
abaixo de 15 px, contraste AA em tudo, alvos de toque de 44 px ou mais, aviso sempre em
palavras além da cor, e `prefers-reduced-motion` respeitado.
