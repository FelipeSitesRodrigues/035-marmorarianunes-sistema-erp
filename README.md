# Sistema da Marmoraria Nunes

Estoque e financeiro da Marmoraria Nunes (Irecê-BA), feito pra Val usar sem
ajuda. Escopo e mockup em `sites/035 - Marmoraria Nunes Irecê/sistema/`.

## Como é feito

- **Next.js 16** (App Router), CSS Modules, ícones Phosphor, Playfair Display + Archivo.
- **Postgres direto** (pacote `postgres`), sem supabase-js. Em produção o banco é
  o projeto do Supabase da **Nobre** (070), dividido: tudo da Nunes mora no schema
  `nunes` e o sistema conecta com o usuário `nunes_app`, que só enxerga esse schema.
- **Login próprio**: e-mail e senha (scrypt), sessão de 30 dias que renova com o uso,
  token aleatório no cookie e só o hash no banco. Sem "esqueci a senha": quem troca é
  o Felipe, por `scripts/acesso.mjs`.
- **As regras moram no banco** (`db/migracoes/001_base.sql`): cada registro é uma
  função que roda numa transação só. Estoque nunca fica negativo, clique duplo não
  duplica (chave do formulário), corrigir guarda o original, cancelar desfaz o
  efeito, e movimento e evento não podem ser apagados nem reescritos.

## O modelo, em uma tela

| Tabela | O que guarda |
|---|---|
| `materiais` | pedras e insumos: quantidade, mínimo, custo médio ponderado |
| `operacoes` | cada coisa registrada: cadastro, compra, venda, saída, despesa, ajuste |
| `movimentos` | o que entrou e saiu do estoque, por operação (com saldo depois) |
| `lancamentos` | o dinheiro: entrada ou saída, pendente ou quitado, vencimento |
| `eventos` | quem fez o quê e quando (recebeu, corrigiu, cancelou...) |

Movimento de estoque e movimento de dinheiro são separados: usar pedra numa obra
mexe só no estoque; venda a prazo vira valor a receber, não dinheiro no caixa.

## Rodar na máquina

Dois cliques no `ABRIR-SITE.bat`: sobe o banco local (janela minimizada), o sistema e abre o navegador em http://localhost:3035. Na mão:

```bash
npm install
npm run db -- --demo     # Postgres local na porta 5435, com dados de demonstração
npm run dev              # http://localhost:3035  (val@nunes.local / nunes-demo-2026)
```

| Comando | O que faz |
|---|---|
| `npm run testar` | 39 testes das regras de estoque e dinheiro, direto no banco |
| `node scripts/testar-telas.mjs` | teste de ponta a ponta clicando nas telas (com `db` e `dev` rodando) |
| `node scripts/print.mjs <caminho> 1440,390 <nome> --pagina-inteira` | prints de revisão em `revisao/` |
| `npm run pedras` | refaz miniaturas e texturas a partir de `recursos/` |

No Git Bash, rodar os scripts de print com `MSYS_NO_PATHCONV=1` (senão "/" vira caminho do Windows).

## Publicar (Supabase da Nobre + Vercel)

1. Usuários do banco (uma vez): `ADMIN_DATABASE_URL=<postgres da Nobre> SUPABASE_REF=<ref> node scripts/criar-usuario-banco.mjs`
2. Tabelas e permissões: `ADMIN_DATABASE_URL=<postgres da Nobre> node scripts/migrar.mjs` (rodar de novo a cada migração nova)
3. Vercel: importar o repositório, variável `DATABASE_URL` com o endereço do `nunes_app` (pooler, porta 6543). Região `gru1` já está no `vercel.json`.
4. Login da Val: `DATABASE_URL=<nunes_app> node scripts/acesso.mjs criar <email> Val`
5. Backup: segredos `BACKUP_DATABASE_URL` (usuário `nunes_backup`) e `BACKUP_SENHA` no GitHub. A Action roda todo dia e mantém o Supabase grátis acordado.

## Pastas

- `db/migracoes/` tabelas, visão e funções; `db/permissoes.sql` o que cada usuário pode
- `src/lib/acoes/` ações do servidor (cada botão Salvar); `src/lib/consultas/` leituras
- `src/components/registro/` painel lateral e os seis formulários
- `recursos/` fotos das pedras (do catálogo do site) e logo; `public/` o que é servido
