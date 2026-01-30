-- Script de teste para verificar se o salvamento de presença funciona
-- Execute no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT COUNT(*) as total_records FROM attendance_records;

-- 2. Tentar inserir um registro de teste manualmente
INSERT INTO attendance_records (user_id, student_id, class_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'a@gmail.com'),
  (SELECT id FROM students LIMIT 1),
  (SELECT id FROM classes LIMIT 1)
);

-- 3. Verificar se foi inserido
SELECT * FROM attendance_records ORDER BY created_at DESC LIMIT 5;

-- 4. Verificar políticas RLS
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'attendance_records';

-- 5. Testar se o usuário atual tem permissão
SELECT 
  auth.uid() as current_user_id,
  (SELECT id FROM auth.users WHERE email = 'a@gmail.com') as expected_user_id,
  auth.uid() = (SELECT id FROM auth.users WHERE email = 'a@gmail.com') as has_permission;
