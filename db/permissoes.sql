-- Usuário do sistema: lê e grava só no schema nunes. Não apaga histórico
-- (os gatilhos também barram) e não enxerga nada da Nobre no schema public.
grant usage on schema nunes to nunes_app;
grant select, insert, update on all tables in schema nunes to nunes_app;
grant delete on nunes.sessoes, nunes.tentativas_login to nunes_app;
revoke all on nunes._migracoes from nunes_app;
grant usage, select on all sequences in schema nunes to nunes_app;
grant execute on all functions in schema nunes to nunes_app;

alter role nunes_app set search_path = nunes;
alter role nunes_app set timezone = 'America/Bahia';

-- Usuário do backup diário (GitHub Actions): só leitura, sem sessões nem tentativas de login
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'nunes_backup') then
    grant usage on schema nunes to nunes_backup;
    grant select on all tables in schema nunes to nunes_backup;
    revoke select on nunes.sessoes, nunes.tentativas_login from nunes_backup;
    alter role nunes_backup set search_path = nunes;
    alter role nunes_backup set default_transaction_read_only = on;
  end if;
end $$;
