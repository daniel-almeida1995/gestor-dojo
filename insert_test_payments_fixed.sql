-- Script para adicionar user_id à tabela payments (se necessário) e inserir dados de teste
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Adicionar coluna user_id se não existir
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- PASSO 2: Atualizar user_id para registros existentes (se houver)
UPDATE payments 
SET user_id = (SELECT user_id FROM students WHERE students.id = payments.student_id LIMIT 1)
WHERE user_id IS NULL;

-- PASSO 3: Inserir pagamentos de teste
-- Pagamento 1: Mensalidade paga (Janeiro 2026) - Pix
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description,
  type
) 
SELECT 
  s.user_id,
  s.id,
  '2026-01-01'::date,
  150.00,
  'paid',
  'pix',
  '2026-01-05 14:30:00'::timestamp,
  'Mensalidade Janeiro',
  'tuition'
FROM students s
LIMIT 1;

-- Pagamento 2: Mensalidade paga (Fevereiro 2026) - Dinheiro
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description,
  type
) 
SELECT 
  s.user_id,
  s.id,
  '2026-02-01'::date,
  150.00,
  'paid',
  'cash',
  '2026-02-03 10:15:00'::timestamp,
  'Mensalidade Fevereiro',
  'tuition'
FROM students s
LIMIT 1 OFFSET 1;

-- Pagamento 3: Mensalidade pendente
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  description,
  type
) 
SELECT 
  s.user_id,
  s.id,
  '2026-02-01'::date,
  150.00,
  'pending',
  'Mensalidade Fevereiro',
  'tuition'
FROM students s
LIMIT 1 OFFSET 2;

-- Pagamento 4: Mensalidade atrasada
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  description,
  type
) 
SELECT 
  s.user_id,
  s.id,
  '2026-01-01'::date,
  150.00,
  'overdue',
  'Mensalidade Janeiro',
  'tuition'
FROM students s
LIMIT 1 OFFSET 3;

-- Pagamento 5: Produto vendido (Kimono) - Cartão
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description,
  type
) 
SELECT 
  s.user_id,
  s.id,
  '2026-02-01'::date,
  250.00,
  'paid',
  'card',
  '2026-02-02 16:45:00'::timestamp,
  'Kimono Branco',
  'product'
FROM students s
LIMIT 1;

-- Pagamento 6: Seminário - Pix
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description,
  type
) 
SELECT 
  s.user_id,
  s.id,
  '2026-02-01'::date,
  200.00,
  'paid',
  'pix',
  '2026-02-01 09:20:00'::timestamp,
  'Seminário de Kata',
  'seminar'
FROM students s
LIMIT 1 OFFSET 1;

-- PASSO 4: Verificar os pagamentos inseridos
SELECT 
  p.id,
  p.description,
  p.amount,
  p.status,
  p.payment_method,
  p.paid_at,
  s.name as student_name
FROM payments p
JOIN students s ON p.student_id = s.id
ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC;
