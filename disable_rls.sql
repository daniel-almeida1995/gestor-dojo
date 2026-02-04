
-- Desabilitar segurança temporariamente para teste
alter table organization_settings disable row level security;

-- Verificar se existe algum dado gravado
select * from organization_settings;
