-- Sistema de gestão da Marmoraria Nunes: estoque e financeiro.
--
-- Tudo mora no schema "nunes". O banco é dividido com outro projeto (Nobre
-- Estofados), então nada aqui toca o schema public, e o sistema conecta com
-- um usuário próprio (nunes_app) que só enxerga este schema.
--
-- As regras de negócio ficam em funções do banco, uma transação por operação:
-- estoque que nunca fica negativo, compra e venda que não duplicam (chave do
-- formulário) e correção que guarda o original em vez de apagar.

create schema if not exists nunes;
revoke all on schema nunes from public;

-- ---------------------------------------------------------------------------
-- Acesso
-- ---------------------------------------------------------------------------

create table nunes.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 1 and 80),
  email text not null unique check (email = lower(email)),
  senha_hash text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- O cookie guarda um token aleatório; aqui fica só o hash dele.
create table nunes.sessoes (
  token_hash text primary key,
  usuario_id uuid not null references nunes.usuarios(id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
create index sessoes_usuario on nunes.sessoes (usuario_id);

create table nunes.tentativas_login (
  id bigint generated always as identity primary key,
  chave text not null,
  criado_em timestamptz not null default now()
);
create index tentativas_chave on nunes.tentativas_login (chave, criado_em);

-- ---------------------------------------------------------------------------
-- Estoque e dinheiro
-- ---------------------------------------------------------------------------

create table nunes.materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 1 and 80),
  categoria text not null check (categoria in ('Granito', 'Mármore', 'Quartzito', 'Sinterizado', 'Insumo', 'Outro')),
  unidade text not null check (unidade in ('chapa', 'm2', 'metro', 'unidade', 'peca', 'caixa', 'kg', 'litro')),
  quantidade numeric(12, 3) not null default 0 check (quantidade >= 0),
  estoque_minimo numeric(12, 3) not null default 0 check (estoque_minimo >= 0),
  -- Custo médio ponderado das compras. 4 casas pra correção desfazer a conta sem sobra.
  custo_medio numeric(14, 4) not null default 0 check (custo_medio >= 0),
  fornecedor text,
  observacoes text,
  foto text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index materiais_nome_unico on nunes.materiais (lower(nome)) where ativo;

-- Cada coisa que a Val registra vira uma operação. O estoque (movimentos) e o
-- dinheiro (lancamentos) penduram nela, então uma venda nunca é contada duas vezes.
create table nunes.operacoes (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity unique,
  tipo text not null check (tipo in ('cadastro', 'compra', 'venda', 'saida', 'despesa', 'ajuste')),
  data date not null,
  contraparte text,          -- cliente da venda, fornecedor da compra, a quem pagou a despesa
  referencia text,           -- serviço da venda, obra da saída
  motivo text,               -- saída: obra, perda, descarte, outro. Ajuste: texto livre
  categoria text,            -- despesa: frete, energia, salário...
  descricao text,            -- despesa: o que foi
  valor_total numeric(12, 2) not null default 0 check (valor_total >= 0),
  observacoes text,
  situacao text not null default 'ativa' check (situacao in ('ativa', 'corrigida', 'cancelada')),
  substitui_id uuid references nunes.operacoes(id),
  substituida_por uuid references nunes.operacoes(id),
  motivo_alteracao text,
  alterada_em timestamptz,
  alterada_por uuid references nunes.usuarios(id),
  chave uuid unique,         -- gerada quando o formulário abre: clique duplo não duplica
  criado_por uuid references nunes.usuarios(id),
  criado_em timestamptz not null default now(),
  check (tipo <> 'saida' or motivo in ('obra', 'perda', 'descarte', 'outro'))
);
create index operacoes_data on nunes.operacoes (data);
create index operacoes_tipo_data on nunes.operacoes (tipo, data);

create table nunes.movimentos (
  id bigint generated always as identity primary key,
  operacao_id uuid not null references nunes.operacoes(id),
  material_id uuid not null references nunes.materiais(id),
  sentido smallint not null check (sentido in (1, -1)),
  quantidade numeric(12, 3) not null check (quantidade > 0),
  custo_unitario numeric(14, 4) not null default 0 check (custo_unitario >= 0),
  saldo_depois numeric(12, 3) not null,
  estorno boolean not null default false,
  criado_em timestamptz not null default now()
);
create index movimentos_material on nunes.movimentos (material_id, criado_em);
create index movimentos_operacao on nunes.movimentos (operacao_id);

create table nunes.lancamentos (
  id uuid primary key default gen_random_uuid(),
  operacao_id uuid not null references nunes.operacoes(id),
  natureza text not null check (natureza in ('entrada', 'saida')),
  valor numeric(12, 2) not null check (valor > 0),
  vencimento date not null,
  situacao text not null check (situacao in ('pendente', 'quitado', 'cancelado')),
  quitado_em date,
  forma_pagamento text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (situacao <> 'quitado' or quitado_em is not null),
  check (situacao <> 'pendente' or quitado_em is null)
);
create index lancamentos_operacao on nunes.lancamentos (operacao_id);
create index lancamentos_situacao on nunes.lancamentos (situacao, vencimento);
create index lancamentos_quitado on nunes.lancamentos (quitado_em) where situacao = 'quitado';

create table nunes.eventos (
  id bigint generated always as identity primary key,
  usuario_id uuid references nunes.usuarios(id),
  acao text not null,
  operacao_id uuid references nunes.operacoes(id),
  material_id uuid references nunes.materiais(id),
  lancamento_id uuid references nunes.lancamentos(id),
  detalhes jsonb not null default '{}',
  criado_em timestamptz not null default now()
);
create index eventos_operacao on nunes.eventos (operacao_id);
create index eventos_material on nunes.eventos (material_id);

-- Histórico confiável: movimento e evento nunca mudam; operação e lançamento
-- mudam de situação, mas nunca somem.
create function nunes.bloquear_alteracao() returns trigger
language plpgsql as $$
begin
  raise exception 'O histórico não pode ser apagado nem reescrito.';
end $$;

create trigger movimentos_imutaveis before update or delete on nunes.movimentos
  for each row execute function nunes.bloquear_alteracao();
create trigger eventos_imutaveis before update or delete on nunes.eventos
  for each row execute function nunes.bloquear_alteracao();
create trigger operacoes_sem_apagar before delete on nunes.operacoes
  for each row execute function nunes.bloquear_alteracao();
create trigger lancamentos_sem_apagar before delete on nunes.lancamentos
  for each row execute function nunes.bloquear_alteracao();

-- ---------------------------------------------------------------------------
-- Texto pras mensagens
-- ---------------------------------------------------------------------------

create function nunes.fmt_qtd(p_qtd numeric, p_unidade text) returns text
language sql immutable as $$
  select replace(rtrim(rtrim(to_char(p_qtd, 'FM999999990.000'), '0'), '.'), '.', ',')
    || ' '
    || case p_unidade
         when 'chapa' then case when p_qtd = 1 then 'chapa' else 'chapas' end
         when 'm2' then 'm²'
         when 'metro' then case when p_qtd = 1 then 'metro' else 'metros' end
         when 'unidade' then case when p_qtd = 1 then 'unidade' else 'unidades' end
         when 'peca' then case when p_qtd = 1 then 'peça' else 'peças' end
         when 'caixa' then case when p_qtd = 1 then 'caixa' else 'caixas' end
         when 'kg' then 'kg'
         when 'litro' then case when p_qtd = 1 then 'litro' else 'litros' end
         else p_unidade
       end
$$;

create function nunes.fmt_reais(p_valor numeric) returns text
language sql immutable as $$
  select 'R$ ' || replace(replace(replace(to_char(p_valor, 'FM999,999,990.00'), ',', '#'), '.', ','), '#', '.')
$$;

create function nunes.texto(p jsonb, p_campo text) returns text
language sql immutable as $$
  select nullif(trim(p ->> p_campo), '')
$$;

-- ---------------------------------------------------------------------------
-- Estoque
-- ---------------------------------------------------------------------------

-- Única porta de entrada e saída de pedra. Trava a linha do material, confere o
-- saldo, recalcula o custo médio e grava o movimento.
--   entrada (sentido 1): p_custo é o valor por unidade que entra no custo médio
--   saída (sentido -1): sai pelo custo médio do momento
--   estorno de entrada: p_custo é o custo da entrada desfeita, que sai da média
create function nunes.mover_estoque(
  p_operacao uuid, p_material uuid, p_sentido smallint, p_qtd numeric,
  p_custo numeric default null, p_estorno boolean default false
) returns numeric
language plpgsql as $$
declare
  m nunes.materiais%rowtype;
  v_novo numeric;
  v_custo numeric;
  v_custo_mov numeric;
begin
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;

  select * into m from nunes.materiais where id = p_material for update;
  if not found then
    raise exception 'Material não encontrado.';
  end if;
  if not m.ativo and not p_estorno then
    raise exception '% foi arquivado e não recebe mais movimento.', m.nome;
  end if;

  v_novo := m.quantidade + p_sentido * p_qtd;
  if v_novo < 0 then
    if p_estorno then
      raise exception 'Não dá pra desfazer: parte de % já saiu do estoque. Hoje tem %.',
        m.nome, nunes.fmt_qtd(m.quantidade, m.unidade);
    end if;
    raise exception 'Só tem % de % no estoque. Confira a quantidade.',
      nunes.fmt_qtd(m.quantidade, m.unidade), m.nome
      using detail = p_material::text;
  end if;

  v_custo := m.custo_medio;
  if p_sentido = 1 then
    v_custo_mov := coalesce(p_custo, m.custo_medio);
    v_custo := (m.quantidade * m.custo_medio + p_qtd * v_custo_mov) / v_novo;
  elsif p_estorno then
    v_custo_mov := coalesce(p_custo, m.custo_medio);
    if v_novo > 0 then
      v_custo := greatest((m.quantidade * m.custo_medio - p_qtd * v_custo_mov) / v_novo, 0);
    end if;
  else
    v_custo_mov := m.custo_medio;
  end if;

  update nunes.materiais
     set quantidade = v_novo, custo_medio = round(v_custo, 4), atualizado_em = now()
   where id = p_material;

  insert into nunes.movimentos (operacao_id, material_id, sentido, quantidade, custo_unitario, saldo_depois, estorno)
  values (p_operacao, p_material, p_sentido, p_qtd, round(v_custo_mov, 4), v_novo, p_estorno);

  return v_novo;
end $$;

-- Desfaz os movimentos de uma operação num sentido só. A correção desfaz as
-- saídas antes de gravar a operação nova e as entradas depois, pra não barrar
-- por falta de saldo uma troca que no fim fecha a conta.
create function nunes.estornar(p_operacao uuid, p_sentido smallint) returns void
language plpgsql as $$
declare
  mv record;
begin
  for mv in
    select * from nunes.movimentos
     where operacao_id = p_operacao and not estorno and sentido = p_sentido
     order by id
  loop
    perform nunes.mover_estoque(p_operacao, mv.material_id, (-mv.sentido)::smallint, mv.quantidade, mv.custo_unitario, true);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Dinheiro
-- ---------------------------------------------------------------------------

-- p_pag: { modo: tudo | parte | depois, valor_pago, forma, vencimento }
create function nunes.lancar_pagamento(p_op uuid, p_natureza text, p_total numeric, p_pag jsonb, p_data date)
returns void
language plpgsql as $$
declare
  v_modo text := coalesce(nunes.texto(p_pag, 'modo'), 'tudo');
  v_forma text := nunes.texto(p_pag, 'forma');
  v_pago numeric;
  v_resto numeric;
  v_venc date;
  v_verbo text := case p_natureza when 'entrada' then 'recebido' else 'pago' end;
begin
  if p_total <= 0 then
    return;
  end if;

  v_pago := case v_modo
    when 'tudo' then p_total
    when 'depois' then 0
    when 'parte' then coalesce(nullif(p_pag ->> 'valor_pago', '')::numeric, 0)
  end;
  if v_pago is null then
    raise exception 'Escolha como foi o pagamento.';
  end if;
  if v_modo = 'parte' and (v_pago <= 0 or v_pago >= p_total) then
    raise exception 'O valor % agora precisa ser maior que zero e menor que o total de %.', v_verbo, nunes.fmt_reais(p_total);
  end if;
  v_resto := p_total - v_pago;

  if v_pago > 0 then
    if v_forma is null then
      raise exception 'Diga como foi %: Pix, dinheiro, cartão...', v_verbo;
    end if;
    insert into nunes.lancamentos (operacao_id, natureza, valor, vencimento, situacao, quitado_em, forma_pagamento)
    values (p_op, p_natureza, v_pago, p_data, 'quitado', p_data, v_forma);
  end if;

  if v_resto > 0 then
    v_venc := nullif(p_pag ->> 'vencimento', '')::date;
    if v_venc is null then
      raise exception 'Diga a data em que o restante vai ser %.', v_verbo;
    end if;
    insert into nunes.lancamentos (operacao_id, natureza, valor, vencimento, situacao, forma_pagamento)
    values (p_op, p_natureza, v_resto, v_venc, 'pendente', case when v_modo = 'depois' then v_forma end);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Resumo devolvido pra tela montar a confirmação
-- ---------------------------------------------------------------------------

create function nunes.resumo_operacao(p_op uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', o.id,
    'numero', o.numero,
    'tipo', o.tipo,
    'situacao', o.situacao,
    'valor_total', o.valor_total,
    'contraparte', o.contraparte,
    'materiais', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'nome', m.nome, 'unidade', m.unidade,
               'quantidade', m.quantidade, 'estoque_minimo', m.estoque_minimo,
               'movido', x.movido) order by m.nome)
        from (select material_id, sum(sentido * quantidade) as movido
                from nunes.movimentos where operacao_id = o.id and not estorno
               group by material_id) x
        join nunes.materiais m on m.id = x.material_id
    ), '[]'::jsonb),
    'quitado', coalesce((select sum(valor) from nunes.lancamentos where operacao_id = o.id and situacao = 'quitado'), 0),
    'pendente', coalesce((select sum(valor) from nunes.lancamentos where operacao_id = o.id and situacao = 'pendente'), 0),
    'vencimento', (select min(vencimento) from nunes.lancamentos where operacao_id = o.id and situacao = 'pendente')
  )
  from nunes.operacoes o
  where o.id = p_op
$$;

-- ---------------------------------------------------------------------------
-- Operações
-- ---------------------------------------------------------------------------

create function nunes.operacao_pela_chave(p jsonb) returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  if nunes.texto(p, 'chave') is null then
    raise exception 'Formulário sem chave. Feche e abra de novo.';
  end if;
  select id into v_id from nunes.operacoes where chave = (p ->> 'chave')::uuid;
  return v_id;
end $$;

create function nunes.data_da(p jsonb) returns date
language sql stable as $$
  select coalesce(nullif(p ->> 'data', '')::date, current_date)
$$;

-- itens: [{ material_id, quantidade, valor_unitario }]
create function nunes.registrar_compra(p jsonb, p_usuario uuid, p_sem_pagamento boolean default false)
returns jsonb
language plpgsql as $$
declare
  v_op uuid := nunes.operacao_pela_chave(p);
  v_data date := nunes.data_da(p);
  v_fornecedor text := nunes.texto(p, 'fornecedor');
  v_item jsonb;
  v_qtd numeric;
  v_vu numeric;
  v_total numeric := 0;
begin
  if v_op is not null then
    return nunes.resumo_operacao(v_op);
  end if;
  if jsonb_array_length(coalesce(p -> 'itens', '[]')) = 0 then
    raise exception 'Escolha o material comprado.';
  end if;

  for v_item in select * from jsonb_array_elements(p -> 'itens') loop
    v_qtd := nullif(v_item ->> 'quantidade', '')::numeric;
    v_vu := nullif(v_item ->> 'valor_unitario', '')::numeric;
    if v_qtd is null or v_qtd <= 0 then
      raise exception 'Diga quantas unidades chegaram.';
    end if;
    if v_vu is null or v_vu < 0 then
      raise exception 'Diga quanto custou cada unidade.';
    end if;
    v_total := v_total + round(v_qtd * v_vu, 2);
  end loop;

  insert into nunes.operacoes (tipo, data, contraparte, valor_total, observacoes, chave, criado_por, substitui_id)
  values ('compra', v_data, v_fornecedor, v_total, nunes.texto(p, 'observacoes'),
          (p ->> 'chave')::uuid, p_usuario, nullif(p ->> 'substitui_id', '')::uuid)
  returning id into v_op;

  for v_item in select * from jsonb_array_elements(p -> 'itens') loop
    perform nunes.mover_estoque(v_op, (v_item ->> 'material_id')::uuid, 1::smallint,
                                (v_item ->> 'quantidade')::numeric, (v_item ->> 'valor_unitario')::numeric);
    if v_fornecedor is not null then
      update nunes.materiais set fornecedor = v_fornecedor where id = (v_item ->> 'material_id')::uuid;
    end if;
  end loop;

  if not p_sem_pagamento then
    perform nunes.lancar_pagamento(v_op, 'saida', v_total, p -> 'pagamento', v_data);
  end if;

  insert into nunes.eventos (usuario_id, acao, operacao_id, detalhes)
  values (p_usuario, 'registrou compra', v_op, p);
  return nunes.resumo_operacao(v_op);
end $$;

-- itens opcionais: venda só de serviço não mexe no estoque
create function nunes.registrar_venda(p jsonb, p_usuario uuid, p_sem_pagamento boolean default false)
returns jsonb
language plpgsql as $$
declare
  v_op uuid := nunes.operacao_pela_chave(p);
  v_data date := nunes.data_da(p);
  v_total numeric := nullif(p ->> 'valor_total', '')::numeric;
  v_item jsonb;
begin
  if v_op is not null then
    return nunes.resumo_operacao(v_op);
  end if;
  if nunes.texto(p, 'cliente') is null then
    raise exception 'Diga pra quem foi a venda.';
  end if;
  if v_total is null or v_total <= 0 then
    raise exception 'Diga o valor total da venda.';
  end if;

  insert into nunes.operacoes (tipo, data, contraparte, referencia, valor_total, observacoes, chave, criado_por, substitui_id)
  values ('venda', v_data, nunes.texto(p, 'cliente'), nunes.texto(p, 'servico'), round(v_total, 2),
          nunes.texto(p, 'observacoes'), (p ->> 'chave')::uuid, p_usuario, nullif(p ->> 'substitui_id', '')::uuid)
  returning id into v_op;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'itens', '[]')) loop
    perform nunes.mover_estoque(v_op, (v_item ->> 'material_id')::uuid, (-1)::smallint,
                                nullif(v_item ->> 'quantidade', '')::numeric);
  end loop;

  if not p_sem_pagamento then
    perform nunes.lancar_pagamento(v_op, 'entrada', round(v_total, 2), p -> 'pagamento', v_data);
  end if;

  insert into nunes.eventos (usuario_id, acao, operacao_id, detalhes)
  values (p_usuario, 'registrou venda', v_op, p);
  return nunes.resumo_operacao(v_op);
end $$;

-- Saída sem dinheiro: uso em obra, perda, descarte. Muda o estoque, não o caixa.
create function nunes.registrar_saida(p jsonb, p_usuario uuid, p_sem_pagamento boolean default false)
returns jsonb
language plpgsql as $$
declare
  v_op uuid := nunes.operacao_pela_chave(p);
  v_motivo text := nunes.texto(p, 'motivo');
  v_item jsonb;
begin
  if v_op is not null then
    return nunes.resumo_operacao(v_op);
  end if;
  if v_motivo is null or v_motivo not in ('obra', 'perda', 'descarte', 'outro') then
    raise exception 'Escolha por que a pedra está saindo.';
  end if;
  if jsonb_array_length(coalesce(p -> 'itens', '[]')) = 0 then
    raise exception 'Escolha o material que está saindo.';
  end if;

  insert into nunes.operacoes (tipo, data, motivo, referencia, observacoes, chave, criado_por, substitui_id)
  values ('saida', nunes.data_da(p), v_motivo, nunes.texto(p, 'referencia'), nunes.texto(p, 'observacoes'),
          (p ->> 'chave')::uuid, p_usuario, nullif(p ->> 'substitui_id', '')::uuid)
  returning id into v_op;

  for v_item in select * from jsonb_array_elements(p -> 'itens') loop
    perform nunes.mover_estoque(v_op, (v_item ->> 'material_id')::uuid, (-1)::smallint,
                                nullif(v_item ->> 'quantidade', '')::numeric);
  end loop;

  insert into nunes.eventos (usuario_id, acao, operacao_id, detalhes)
  values (p_usuario, 'registrou saída', v_op, p);
  return nunes.resumo_operacao(v_op);
end $$;

-- pagamento.modo: tudo (já pagou) | depois
create function nunes.lancar_despesa(p jsonb, p_usuario uuid, p_sem_pagamento boolean default false)
returns jsonb
language plpgsql as $$
declare
  v_op uuid := nunes.operacao_pela_chave(p);
  v_data date := nunes.data_da(p);
  v_valor numeric := nullif(p ->> 'valor', '')::numeric;
begin
  if v_op is not null then
    return nunes.resumo_operacao(v_op);
  end if;
  if nunes.texto(p, 'descricao') is null then
    raise exception 'Diga o que foi a despesa.';
  end if;
  if v_valor is null or v_valor <= 0 then
    raise exception 'Diga o valor da despesa.';
  end if;
  if coalesce(nunes.texto(p -> 'pagamento', 'modo'), 'tudo') = 'parte' then
    raise exception 'Despesa é paga inteira ou fica pra depois.';
  end if;

  insert into nunes.operacoes (tipo, data, categoria, descricao, contraparte, valor_total, observacoes, chave, criado_por, substitui_id)
  values ('despesa', v_data, coalesce(nunes.texto(p, 'categoria'), 'Outras'), nunes.texto(p, 'descricao'),
          nunes.texto(p, 'contraparte'), round(v_valor, 2), nunes.texto(p, 'observacoes'),
          (p ->> 'chave')::uuid, p_usuario, nullif(p ->> 'substitui_id', '')::uuid)
  returning id into v_op;

  if not p_sem_pagamento then
    perform nunes.lancar_pagamento(v_op, 'saida', round(v_valor, 2), p -> 'pagamento', v_data);
  end if;

  insert into nunes.eventos (usuario_id, acao, operacao_id, detalhes)
  values (p_usuario, 'lançou despesa', v_op, p);
  return nunes.resumo_operacao(v_op);
end $$;

-- Material novo. O que já está no pátio entra como estoque inicial, sem
-- dinheiro: a compra aconteceu antes do sistema existir.
create function nunes.cadastrar_material(p jsonb, p_usuario uuid) returns jsonb
language plpgsql as $$
declare
  v_op uuid := nunes.operacao_pela_chave(p);
  v_mat uuid;
  v_qtd numeric := coalesce(nullif(p ->> 'quantidade_inicial', '')::numeric, 0);
  v_custo numeric := coalesce(nullif(p ->> 'custo_unitario', '')::numeric, 0);
  v_nome text := nunes.texto(p, 'nome');
begin
  if v_op is not null then
    return nunes.resumo_operacao(v_op);
  end if;
  if v_nome is null then
    raise exception 'Diga o nome da pedra ou do material.';
  end if;
  if exists (select 1 from nunes.materiais where lower(nome) = lower(v_nome) and ativo) then
    raise exception 'Já existe um material chamado %.', v_nome;
  end if;
  if v_qtd < 0 or v_custo < 0 then
    raise exception 'Quantidade e valor não podem ser negativos.';
  end if;

  insert into nunes.materiais (nome, categoria, unidade, estoque_minimo, fornecedor, observacoes, foto)
  values (v_nome, coalesce(nunes.texto(p, 'categoria'), 'Granito'), coalesce(nunes.texto(p, 'unidade'), 'chapa'),
          coalesce(nullif(p ->> 'estoque_minimo', '')::numeric, 0), nunes.texto(p, 'fornecedor'),
          nunes.texto(p, 'observacoes'), nunes.texto(p, 'foto'))
  returning id into v_mat;

  insert into nunes.operacoes (tipo, data, contraparte, descricao, valor_total, chave, criado_por)
  values ('cadastro', nunes.data_da(p), nunes.texto(p, 'fornecedor'), v_nome, round(v_qtd * v_custo, 2),
          (p ->> 'chave')::uuid, p_usuario)
  returning id into v_op;

  if v_qtd > 0 then
    perform nunes.mover_estoque(v_op, v_mat, 1::smallint, v_qtd, v_custo);
  end if;

  insert into nunes.eventos (usuario_id, acao, operacao_id, material_id, detalhes)
  values (p_usuario, 'cadastrou material', v_op, v_mat, p);
  return nunes.resumo_operacao(v_op) || jsonb_build_object('material_id', v_mat);
end $$;

create function nunes.editar_material(p_id uuid, p jsonb, p_usuario uuid) returns void
language plpgsql as $$
declare
  m nunes.materiais%rowtype;
  v_nome text := nunes.texto(p, 'nome');
  v_unidade text := coalesce(nunes.texto(p, 'unidade'), null);
begin
  select * into m from nunes.materiais where id = p_id for update;
  if not found then
    raise exception 'Material não encontrado.';
  end if;
  if v_nome is null then
    raise exception 'O material precisa de um nome.';
  end if;
  if exists (select 1 from nunes.materiais where lower(nome) = lower(v_nome) and ativo and id <> p_id) then
    raise exception 'Já existe um material chamado %.', v_nome;
  end if;
  v_unidade := coalesce(v_unidade, m.unidade);
  if v_unidade <> m.unidade and exists (select 1 from nunes.movimentos where material_id = p_id) then
    raise exception 'A unidade não muda depois que o material já teve entrada ou saída.';
  end if;

  update nunes.materiais set
    nome = v_nome,
    categoria = coalesce(nunes.texto(p, 'categoria'), categoria),
    unidade = v_unidade,
    estoque_minimo = coalesce(nullif(p ->> 'estoque_minimo', '')::numeric, estoque_minimo),
    fornecedor = case when p ? 'fornecedor' then nunes.texto(p, 'fornecedor') else fornecedor end,
    observacoes = case when p ? 'observacoes' then nunes.texto(p, 'observacoes') else observacoes end,
    foto = coalesce(nunes.texto(p, 'foto'), foto),
    atualizado_em = now()
  where id = p_id;

  insert into nunes.eventos (usuario_id, acao, material_id, detalhes)
  values (p_usuario, 'editou material', p_id,
          jsonb_build_object('antes', to_jsonb(m) - 'quantidade' - 'custo_medio', 'depois', p));
end $$;

-- Contagem do pátio: a quantidade certa entra, a diferença vira movimento.
create function nunes.ajustar_estoque(p jsonb, p_usuario uuid) returns jsonb
language plpgsql as $$
declare
  v_op uuid := nunes.operacao_pela_chave(p);
  m nunes.materiais%rowtype;
  v_contada numeric := nullif(p ->> 'quantidade_contada', '')::numeric;
  v_dif numeric;
begin
  if v_op is not null then
    return nunes.resumo_operacao(v_op);
  end if;
  select * into m from nunes.materiais where id = nullif(p ->> 'material_id', '')::uuid for update;
  if not found then
    raise exception 'Escolha o material.';
  end if;
  if v_contada is null or v_contada < 0 then
    raise exception 'Diga quanto tem de verdade no estoque.';
  end if;
  if nunes.texto(p, 'motivo') is null then
    raise exception 'Diga por que a quantidade mudou.';
  end if;
  v_dif := v_contada - m.quantidade;
  if v_dif = 0 then
    raise exception 'A quantidade contada é igual à do sistema. Nada pra ajustar.';
  end if;

  insert into nunes.operacoes (tipo, data, motivo, observacoes, chave, criado_por)
  values ('ajuste', nunes.data_da(p), nunes.texto(p, 'motivo'), nunes.texto(p, 'observacoes'),
          (p ->> 'chave')::uuid, p_usuario)
  returning id into v_op;

  perform nunes.mover_estoque(v_op, m.id, sign(v_dif)::smallint, abs(v_dif), m.custo_medio);

  insert into nunes.eventos (usuario_id, acao, operacao_id, material_id, detalhes)
  values (p_usuario, 'ajustou estoque', v_op, m.id,
          jsonb_build_object('antes', m.quantidade, 'depois', v_contada, 'motivo', p ->> 'motivo'));
  return nunes.resumo_operacao(v_op);
end $$;

-- Recebi / Paguei. Valor menor que o devido quita uma parte e o resto continua aberto.
create function nunes.quitar_lancamento(p_id uuid, p_valor numeric, p_data date, p_forma text, p_usuario uuid)
returns void
language plpgsql as $$
declare
  l nunes.lancamentos%rowtype;
  v_valor numeric;
  v_novo uuid;
begin
  select * into l from nunes.lancamentos where id = p_id for update;
  if not found or l.situacao <> 'pendente' then
    raise exception 'Essa conta não está mais em aberto.';
  end if;
  if nullif(trim(p_forma), '') is null then
    raise exception 'Diga como foi %: Pix, dinheiro, cartão...',
      case l.natureza when 'entrada' then 'recebido' else 'pago' end;
  end if;
  v_valor := coalesce(p_valor, l.valor);
  if v_valor <= 0 or v_valor > l.valor then
    raise exception 'O valor precisa ser maior que zero e no máximo %.', nunes.fmt_reais(l.valor);
  end if;

  if v_valor = l.valor then
    update nunes.lancamentos
       set situacao = 'quitado', quitado_em = coalesce(p_data, current_date), forma_pagamento = trim(p_forma), atualizado_em = now()
     where id = p_id;
    v_novo := p_id;
  else
    update nunes.lancamentos set valor = l.valor - v_valor, atualizado_em = now() where id = p_id;
    insert into nunes.lancamentos (operacao_id, natureza, valor, vencimento, situacao, quitado_em, forma_pagamento)
    values (l.operacao_id, l.natureza, v_valor, l.vencimento, 'quitado', coalesce(p_data, current_date), trim(p_forma))
    returning id into v_novo;
  end if;

  insert into nunes.eventos (usuario_id, acao, operacao_id, lancamento_id, detalhes)
  values (p_usuario, case l.natureza when 'entrada' then 'recebeu' else 'pagou' end, l.operacao_id, v_novo,
          jsonb_build_object('valor', v_valor, 'em_aberto_antes', l.valor, 'forma', p_forma, 'data', p_data));
end $$;

-- Desfaz um "Recebi" ou "Paguei" marcado sem querer.
create function nunes.reabrir_lancamento(p_id uuid, p_usuario uuid) returns void
language plpgsql as $$
declare
  l nunes.lancamentos%rowtype;
begin
  select * into l from nunes.lancamentos where id = p_id for update;
  if not found or l.situacao <> 'quitado' then
    raise exception 'Esse valor não está marcado como pago.';
  end if;
  update nunes.lancamentos
     set situacao = 'pendente', quitado_em = null, atualizado_em = now()
   where id = p_id;
  insert into nunes.eventos (usuario_id, acao, operacao_id, lancamento_id, detalhes)
  values (p_usuario, 'reabriu conta', l.operacao_id, p_id, to_jsonb(l));
end $$;

create function nunes.mudar_vencimento(p_id uuid, p_vencimento date, p_usuario uuid) returns void
language plpgsql as $$
declare
  l nunes.lancamentos%rowtype;
begin
  select * into l from nunes.lancamentos where id = p_id for update;
  if not found or l.situacao <> 'pendente' then
    raise exception 'Essa conta não está mais em aberto.';
  end if;
  if p_vencimento is null then
    raise exception 'Escolha a nova data.';
  end if;
  update nunes.lancamentos set vencimento = p_vencimento, atualizado_em = now() where id = p_id;
  insert into nunes.eventos (usuario_id, acao, operacao_id, lancamento_id, detalhes)
  values (p_usuario, 'mudou vencimento', l.operacao_id, p_id,
          jsonb_build_object('antes', l.vencimento, 'depois', p_vencimento));
end $$;

-- Cancelar: a operação vira registro cancelado, o estoque volta e o dinheiro
-- dela deixa de contar. Nada é apagado.
create function nunes.cancelar_operacao(p_id uuid, p_motivo text, p_usuario uuid) returns jsonb
language plpgsql as $$
declare
  o nunes.operacoes%rowtype;
  v_mat uuid;
begin
  select * into o from nunes.operacoes where id = p_id for update;
  if not found then
    raise exception 'Lançamento não encontrado.';
  end if;
  if o.situacao <> 'ativa' then
    raise exception 'Esse lançamento já foi % antes.', case o.situacao when 'corrigida' then 'corrigido' else 'cancelado' end;
  end if;

  if o.tipo = 'cadastro' then
    select material_id into v_mat from nunes.eventos where operacao_id = p_id and material_id is not null limit 1;
    if exists (select 1 from nunes.movimentos where material_id = v_mat and operacao_id <> p_id) then
      raise exception 'Esse material já teve outros lançamentos. Pra tirar do estoque, use Ajustar estoque.';
    end if;
  end if;

  perform nunes.estornar(p_id, (-1)::smallint);
  perform nunes.estornar(p_id, 1::smallint);

  update nunes.lancamentos set situacao = 'cancelado', atualizado_em = now()
   where operacao_id = p_id and situacao <> 'cancelado';
  update nunes.operacoes
     set situacao = 'cancelada', motivo_alteracao = nullif(trim(p_motivo), ''), alterada_em = now(), alterada_por = p_usuario
   where id = p_id;

  if v_mat is not null then
    update nunes.materiais set ativo = false, atualizado_em = now() where id = v_mat;
  end if;

  insert into nunes.eventos (usuario_id, acao, operacao_id, material_id, detalhes)
  values (p_usuario, 'cancelou', p_id, v_mat, jsonb_build_object('motivo', p_motivo));
  return nunes.resumo_operacao(p_id);
end $$;

-- Corrigir: a original fica guardada como "corrigida" e aponta pra nova.
-- O dinheiro que já entrou ou saiu continua valendo e passa pra nova; o que
-- estava em aberto é recalculado pelo total novo.
create function nunes.corrigir_operacao(p_id uuid, p jsonb, p_motivo text, p_usuario uuid) returns jsonb
language plpgsql as $$
declare
  o nunes.operacoes%rowtype;
  v_existente uuid := nunes.operacao_pela_chave(p);
  v_resumo jsonb;
  v_novo uuid;
  v_novo_total numeric;
  v_natureza text;
  v_quitado numeric;
  v_venc date;
  v_tem_dinheiro boolean;
  v_antes jsonb;
begin
  if v_existente is not null then
    return nunes.resumo_operacao(v_existente);
  end if;
  select * into o from nunes.operacoes where id = p_id for update;
  if not found then
    raise exception 'Lançamento não encontrado.';
  end if;
  if o.situacao <> 'ativa' then
    raise exception 'Esse lançamento já foi % antes.', case o.situacao when 'corrigida' then 'corrigido' else 'cancelado' end;
  end if;
  if o.tipo not in ('compra', 'venda', 'saida', 'despesa') then
    raise exception 'Esse tipo de lançamento não se corrige. Use Ajustar estoque ou edite o material.';
  end if;

  v_antes := nunes.resumo_operacao(p_id);
  p := p || jsonb_build_object('substitui_id', p_id);

  perform nunes.estornar(p_id, (-1)::smallint);
  v_resumo := case o.tipo
    when 'compra' then nunes.registrar_compra(p, p_usuario, true)
    when 'venda' then nunes.registrar_venda(p, p_usuario, true)
    when 'saida' then nunes.registrar_saida(p, p_usuario, true)
    when 'despesa' then nunes.lancar_despesa(p, p_usuario, true)
  end;
  v_novo := (v_resumo ->> 'id')::uuid;
  perform nunes.estornar(p_id, 1::smallint);

  if o.tipo in ('compra', 'venda', 'despesa') then
    v_natureza := case o.tipo when 'venda' then 'entrada' else 'saida' end;
    select valor_total into v_novo_total from nunes.operacoes where id = v_novo;
    select exists (select 1 from nunes.lancamentos where operacao_id = p_id and situacao <> 'cancelado')
      into v_tem_dinheiro;

    if not v_tem_dinheiro then
      perform nunes.lancar_pagamento(v_novo, v_natureza, v_novo_total, p -> 'pagamento',
                                     (select data from nunes.operacoes where id = v_novo));
    else
      select coalesce(sum(valor), 0) into v_quitado
        from nunes.lancamentos where operacao_id = p_id and situacao = 'quitado';
      if v_quitado > v_novo_total then
        raise exception 'Já foi % % nesse lançamento, mais que o novo total de %.',
          case v_natureza when 'entrada' then 'recebido' else 'pago' end,
          nunes.fmt_reais(v_quitado), nunes.fmt_reais(v_novo_total);
      end if;
      select min(vencimento) into v_venc
        from nunes.lancamentos where operacao_id = p_id and situacao = 'pendente';

      update nunes.lancamentos set operacao_id = v_novo, atualizado_em = now()
       where operacao_id = p_id and situacao = 'quitado';
      update nunes.lancamentos set situacao = 'cancelado', atualizado_em = now()
       where operacao_id = p_id and situacao = 'pendente';

      if v_novo_total - v_quitado > 0 then
        v_venc := coalesce(nullif(p -> 'pagamento' ->> 'vencimento', '')::date, v_venc,
                           (select data from nunes.operacoes where id = v_novo));
        insert into nunes.lancamentos (operacao_id, natureza, valor, vencimento, situacao)
        values (v_novo, v_natureza, v_novo_total - v_quitado, v_venc, 'pendente');
      end if;
    end if;
  end if;

  update nunes.operacoes
     set situacao = 'corrigida', substituida_por = v_novo, motivo_alteracao = nullif(trim(p_motivo), ''),
         alterada_em = now(), alterada_por = p_usuario
   where id = p_id;

  insert into nunes.eventos (usuario_id, acao, operacao_id, detalhes)
  values (p_usuario, 'corrigiu', p_id,
          jsonb_build_object('motivo', p_motivo, 'antes', v_antes, 'depois', nunes.resumo_operacao(v_novo), 'nova', v_novo));
  return nunes.resumo_operacao(v_novo);
end $$;

create function nunes.arquivar_material(p_id uuid, p_usuario uuid) returns void
language plpgsql as $$
declare
  m nunes.materiais%rowtype;
begin
  select * into m from nunes.materiais where id = p_id for update;
  if not found or not m.ativo then
    raise exception 'Material não encontrado.';
  end if;
  if m.quantidade > 0 then
    raise exception 'Ainda tem % de % no estoque. Só arquiva quando zerar.', nunes.fmt_qtd(m.quantidade, m.unidade), m.nome;
  end if;
  update nunes.materiais set ativo = false, atualizado_em = now() where id = p_id;
  insert into nunes.eventos (usuario_id, acao, material_id) values (p_usuario, 'arquivou material', p_id);
end $$;
