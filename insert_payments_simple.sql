-- Script SIMPLIFICADO para inserir pagamentos de teste
-- Este script pega o user_id automaticamente dos alunos existentes

-- IMPORTANTE: Certifique-se de que há alunos cadastrados primeiro!
-- Execute: SELECT * FROM students LIMIT 5;

-- Se não houver alunos, execute primeiro: insert_test_students_fixed.sql

-- ============================================
-- INSERIR PAGAMENTOS DE TESTE
-- ============================================

-- Pagamento 1: Mensalidade Janeiro - PAGO com Pix
INSERT INTO payments (
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
  id,
  '2026-01-01'::date,
  150.00,
  'paid',
  'pix',
  '2026-01-05 14:30:00'::timestamp,
  'Mensalidade Janeiro',
  'tuition'
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
  description,
  type
) 
SELECT 
  id,
  '2026-02-01'::date,
  150.00,
  'paid',
  'cash',
  '2026-02-03 10:15:00'::timestamp,
  'Mensalidade Fevereiro',
  'tuition'
FROM students
LIMIT 1 OFFSET 1;

-- Pagamento 3: Mensalidade Fevereiro - PENDENTE
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  description,
  type
) 
SELECT 
  id,
  '2026-02-01'::date,
  150.00,
  'pending',
  'Mensalidade Fevereiro',
  'tuition'
FROM students
LIMIT 1 OFFSET 2;

-- Pagamento 4: Mensalidade Janeiro - ATRASADO
INSERT INTO payments (
  student_id,
  reference_month,
  amount,
  status,
  description,
  type
) 
SELECT 
  id,
  '2026-01-01'::date,
  150.00,
  'overdue',
  'Mensalidade Janeiro',
  'tuition'
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
  description,
  type
) 
SELECT 
  id,
  '2026-02-01'::date,
  250.00,
  'paid',
  'card',
  '2026-02-02 16:45:00'::timestamp,
  'Kimono Branco',
  'product'
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
  description,
  type
) 
SELECT 
  id,
  '2026-02-01'::date,
  200.00,
  'paid',
  'pix',
  '2026-02-01 09:20:00'::timestamp,
  'Seminário de Kata',
  'seminar'
FROM students
LIMIT 1 OFFSET 1;

-- ============================================
-- VERIFICAR RESULTADOS
-- ============================================

SELECT 
  p.description,
  p.amount,
  p.status,
  p.payment_method,
  to_char(p.paid_at, 'DD/MM/YYYY HH24:MI') as data_pagamento,
  s.name as aluno
FROM payments p
JOIN students s ON p.student_id = s.id
ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC;
