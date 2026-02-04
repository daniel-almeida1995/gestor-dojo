-- Script MÍNIMO para inserir pagamentos
-- Usa apenas as colunas básicas que devem existir

-- Primeiro, vamos adicionar as colunas que podem estar faltando
ALTER TABLE payments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id uuid;

-- Agora inserir os pagamentos de teste

-- Pagamento 1: PAGO com Pix
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description
) 
SELECT 
  id,
  '2026-01-01'::date,
  150.00,
  'paid',
  'pix',
  '2026-01-05 14:30:00'::timestamp,
  'Mensalidade Janeiro'
FROM students
LIMIT 1;

-- Pagamento 2: PAGO com Dinheiro
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description
) 
SELECT 
  id,
  '2026-02-01'::date,
  150.00,
  'paid',
  'cash',
  '2026-02-03 10:15:00'::timestamp,
  'Mensalidade Fevereiro'
FROM students
LIMIT 1 OFFSET 1;

-- Pagamento 3: PENDENTE
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  description
) 
SELECT 
  id,
  '2026-02-01'::date,
  150.00,
  'pending',
  'Mensalidade Fevereiro'
FROM students
LIMIT 1 OFFSET 2;

-- Pagamento 4: ATRASADO
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  description
) 
SELECT 
  id,
  '2026-01-01'::date,
  150.00,
  'overdue',
  'Mensalidade Janeiro'
FROM students
LIMIT 1 OFFSET 3;

-- Pagamento 5: PAGO com Cartão (Produto)
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description
) 
SELECT 
  id,
  '2026-02-01'::date,
  250.00,
  'paid',
  'card',
  '2026-02-02 16:45:00'::timestamp,
  'Kimono Branco'
FROM students
LIMIT 1;

-- Pagamento 6: PAGO com Pix (Seminário)
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  payment_method,
  paid_at,
  description
) 
SELECT 
  id,
  '2026-02-01'::date,
  200.00,
  'paid',
  'pix',
  '2026-02-01 09:20:00'::timestamp,
  'Seminário de Kata'
FROM students
LIMIT 1 OFFSET 1;

-- Verificar resultados
SELECT 
  p.id,
  s.name as aluno,
  p.description,
  p.amount,
  p.status,
  p.payment_method,
  to_char(p.paid_at, 'DD/MM/YYYY HH24:MI') as data_pagamento
FROM payments p
JOIN students s ON p.student_id = s.id
ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC;
