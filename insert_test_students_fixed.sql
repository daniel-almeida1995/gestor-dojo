-- Script corrigido para adicionar alunos ao usuário correto
-- Execute no SQL Editor do Supabase

-- Verifica qual é o user_id do usuário a@gmail.com
SELECT id, email FROM auth.users WHERE email = 'a@gmail.com';

-- Depois de ver o ID, use este script:
-- (Substitua 'SEU_USER_ID_AQUI' pelo ID que apareceu acima)

INSERT INTO students (user_id, name, phone, modality, belt, belt_color, status, degrees, classes_attended, due_day, monthly_fee) 
SELECT 
  (SELECT id FROM auth.users WHERE email = 'a@gmail.com'),
  name, phone, modality, belt, belt_color, status, degrees, classes_attended, due_day, monthly_fee
FROM (VALUES
  ('Ana Silva', '11987654321', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 0, 12, 10, 200),
  ('Bruno Costa', '11987654322', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 1, 8, 15, 200),
  ('Carlos Mendes', '11987654323', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 2, 15, 5, 200),
  ('Diana Oliveira', '11987654324', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 0, 20, 20, 200),
  ('Eduardo Santos', '11987654325', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 3, 25, 12, 200),
  ('Fernanda Lima', '11987654326', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'payment_issue', 0, 5, 8, 200),
  ('Gabriel Rocha', '11987654327', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 1, 18, 10, 200),
  ('Helena Martins', '11987654328', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 2, 22, 15, 200),
  ('Igor Ferreira', '11987654329', 'Jiu-Jitsu', 'Marrom', '#8B4513', 'active', 4, 30, 5, 200),
  ('Julia Alves', '11987654330', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 0, 10, 20, 200),
  ('Kevin Souza', '11987654331', 'Jiu-Jitsu', 'Azul', '#0000FF', 'payment_issue', 1, 7, 10, 200),
  ('Laura Pereira', '11987654332', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 3, 28, 15, 200),
  ('Marcos Ribeiro', '11987654333', 'Jiu-Jitsu', 'Preta', '#000000', 'active', 0, 35, 5, 200),
  ('Natalia Cardoso', '11987654334', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 2, 9, 20, 200),
  ('Otavio Gomes', '11987654335', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 1, 14, 10, 200),
  ('Patricia Dias', '11987654336', 'Jiu-Jitsu', 'Roxa', '#800080', 'payment_issue', 0, 6, 15, 200),
  ('Quintino Barbosa', '11987654337', 'Jiu-Jitsu', 'Marrom', '#8B4513', 'active', 4, 32, 5, 200),
  ('Rafaela Castro', '11987654338', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 0, 11, 20, 200),
  ('Samuel Araujo', '11987654339', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 2, 16, 10, 200),
  ('Tatiana Moreira', '11987654340', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 3, 24, 15, 200),
  ('Ulisses Teixeira', '11987654341', 'Jiu-Jitsu', 'Preta', '#000000', 'active', 1, 40, 5, 200),
  ('Vanessa Correia', '11987654342', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'inactive', 0, 3, 20, 200),
  ('Wagner Nunes', '11987654343', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 1, 13, 10, 200),
  ('Xavier Monteiro', '11987654344', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 2, 19, 15, 200),
  ('Yasmin Freitas', '11987654345', 'Jiu-Jitsu', 'Marrom', '#8B4513', 'active', 4, 27, 5, 200)
) AS t(name, phone, modality, belt, belt_color, status, degrees, classes_attended, due_day, monthly_fee);

-- Verificar quantos alunos o usuário a@gmail.com tem agora
SELECT COUNT(*) as total_alunos 
FROM students 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'a@gmail.com');
