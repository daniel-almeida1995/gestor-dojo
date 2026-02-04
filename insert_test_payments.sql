-- Script para inserir pagamentos de teste
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos buscar alguns IDs de alunos e do usuário
-- IMPORTANTE: Substitua 'YOUR_USER_ID' pelo seu user_id real do Supabase Auth

-- Exemplo de como obter seu user_id:
-- SELECT auth.uid(); -- Execute isso primeiro para pegar seu ID

-- Depois execute os inserts abaixo substituindo os valores:

-- Pagamento 1: Mensalidade paga (Janeiro 2026)
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
) VALUES (
  (SELECT auth.uid()), -- Seu user_id
  (SELECT id FROM students LIMIT 1), -- Primeiro aluno
  '2026-01-01',
  150.00,
  'paid',
  'pix',
  '2026-01-05 14:30:00',
  'Mensalidade Janeiro',
  'tuition'
);

-- Pagamento 2: Mensalidade paga (Fevereiro 2026)
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
) VALUES (
  (SELECT auth.uid()),
  (SELECT id FROM students LIMIT 1 OFFSET 1), -- Segundo aluno
  '2026-02-01',
  150.00,
  'paid',
  'cash',
  '2026-02-03 10:15:00',
  'Mensalidade Fevereiro',
  'tuition'
);

-- Pagamento 3: Mensalidade pendente
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  description,
  type
) VALUES (
  (SELECT auth.uid()),
  (SELECT id FROM students LIMIT 1 OFFSET 2), -- Terceiro aluno
  '2026-02-01',
  150.00,
  'pending',
  'Mensalidade Fevereiro',
  'tuition'
);

-- Pagamento 4: Mensalidade atrasada
INSERT INTO payments (
  user_id,
  student_id,
  reference_month,
  amount,
  status,
  description,
  type
) VALUES (
  (SELECT auth.uid()),
  (SELECT id FROM students LIMIT 1 OFFSET 3), -- Quarto aluno
  '2026-01-01',
  150.00,
  'overdue',
  'Mensalidade Janeiro',
  'tuition'
);

-- Pagamento 5: Produto vendido (Kimono)
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
) VALUES (
  (SELECT auth.uid()),
  (SELECT id FROM students LIMIT 1),
  '2026-02-01',
  250.00,
  'paid',
  'card',
  '2026-02-02 16:45:00',
  'Kimono Branco',
  'product'
);

-- Pagamento 6: Seminário
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
) VALUES (
  (SELECT auth.uid()),
  (SELECT id FROM students LIMIT 1 OFFSET 1),
  '2026-02-01',
  200.00,
  'paid',
  'pix',
  '2026-02-01 09:20:00',
  'Seminário de Kata',
  'seminar'
);

-- Verificar os pagamentos inseridos
SELECT 
  p.*,
  s.name as student_name
FROM payments p
JOIN students s ON p.student_id = s.id
ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC;
