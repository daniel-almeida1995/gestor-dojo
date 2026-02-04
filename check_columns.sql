-- Verificar a estrutura REAL da tabela payments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
