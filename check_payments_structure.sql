-- Script de diagnóstico para verificar a estrutura da tabela payments
-- Execute este script primeiro no SQL Editor do Supabase

-- 1. Verificar colunas da tabela payments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- 2. Verificar se há alunos cadastrados
SELECT id, name, user_id
FROM students
LIMIT 5;

-- 3. Verificar seu user_id atual
SELECT auth.uid() as my_user_id;
