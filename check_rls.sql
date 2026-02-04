-- Verificar status do RLS e Políticas
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'payments';

-- Verificar as políticas existentes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payments';

-- Verificar novamente as colunas para ter certeza absoluta
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments';
