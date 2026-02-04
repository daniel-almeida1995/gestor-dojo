
-- Verificar contas e dados
select count(*) as total_settings from organization_settings;

-- Mostrar primeiros 5 registros para ver se user_id parece correto
select id, user_id, school_name, created_at from organization_settings limit 5;
