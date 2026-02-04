-- Script FINAL para inserir pagamentos de teste
-- Baseado na estrutura REAL da tabela payments

-- Pagamento 1: Mensalidade Janeiro - PAGO com Pix
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
  '2026-01-05 14:30:00'::timestamp with time zone,
  'Mensalidade Janeiro'
FROM students
LIMIT 1;

-- Pagamento 2: Mensalidade Fevereiro - PAGO com Dinheiro
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
  '2026-02-03 10:15:00'::timestamp with time zone,
  'Mensalidade Fevereiro'
FROM students
LIMIT 1 OFFSET 1;

-- Pagamento 3: Mensalidade Fevereiro - PENDENTE
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

-- Pagamento 4: Mensalidade Janeiro - ATRASADO
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

-- Pagamento 5: Kimono - PAGO com Cartão
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
  '2026-02-02 16:45:00'::timestamp with time zone,
  'Kimono Branco'
FROM students
LIMIT 1;

-- Pagamento 6: Seminário - PAGO com Pix
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
  '2026-02-01 09:20:00'::timestamp with time zone,
  'Seminário de Kata'
FROM students
LIMIT 1 OFFSET 1;

-- Verificar os pagamentos inseridos
SELECT 
  p.id,
  s.name as aluno,
  p.description,
  'R$ ' || p.amount::text as valor,
  p.status,
  p.payment_method as metodo,
  to_char(p.paid_at, 'DD/MM/YYYY HH24:MI') as data_pagamento
FROM payments p
JOIN students s ON p.student_id = s.id
ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC;
