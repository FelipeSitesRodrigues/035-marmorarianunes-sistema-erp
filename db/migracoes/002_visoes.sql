-- Visão de cada operação já com as pedras e o dinheiro dela resumidos, pra
-- as listas (Início, Histórico) não repetirem a mesma conta em cada tela.

create view nunes.v_operacoes as
select
  o.id, o.numero, o.tipo, o.data, o.criado_em, o.contraparte, o.referencia, o.motivo, o.categoria,
  o.descricao, o.valor_total, o.observacoes, o.situacao, o.substitui_id, o.substituida_por,
  o.motivo_alteracao, o.alterada_em,
  coalesce(it.itens, '[]'::jsonb) as itens,
  coalesce(f.quitado, 0) as quitado,
  coalesce(f.pendente, 0) as pendente,
  f.vencimento,
  f.forma,
  u.nome as criado_por_nome
from nunes.operacoes o
left join lateral (
  select jsonb_agg(jsonb_build_object(
           'material_id', m.id, 'nome', m.nome, 'unidade', m.unidade, 'foto', m.foto,
           'quantidade', x.qtd, 'sentido', x.sentido) order by m.nome) as itens
    from (select material_id, sentido, sum(quantidade) as qtd
            from nunes.movimentos
           where operacao_id = o.id and not estorno
           group by material_id, sentido) x
    join nunes.materiais m on m.id = x.material_id
) it on true
left join lateral (
  select sum(valor) filter (where situacao = 'quitado') as quitado,
         sum(valor) filter (where situacao = 'pendente') as pendente,
         min(vencimento) filter (where situacao = 'pendente') as vencimento,
         (array_agg(forma_pagamento order by quitado_em desc, criado_em desc)
            filter (where situacao = 'quitado'))[1] as forma
    from nunes.lancamentos
   where operacao_id = o.id
) f on true
left join nunes.usuarios u on u.id = o.criado_por;
