-- Script simplificado para inserir alunos de teste
-- Execute no SQL Editor do Supabase

-- Insere 25 alunos de uma vez
INSERT INTO students (user_id, name, phone, modality, belt, belt_color, status, degrees, classes_attended, due_day, monthly_fee)
VALUES
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Ana Silva', '11987654321', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 0, 12, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Bruno Costa', '11987654322', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 1, 8, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Carlos Mendes', '11987654323', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 2, 15, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Diana Oliveira', '11987654324', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 0, 20, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Eduardo Santos', '11987654325', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 3, 25, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Fernanda Lima', '11987654326', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'payment_issue', 0, 5, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Gabriel Rocha', '11987654327', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 1, 18, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Helena Martins', '11987654328', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 2, 22, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Igor Ferreira', '11987654329', 'Jiu-Jitsu', 'Marrom', '#8B4513', 'active', 4, 30, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Julia Alves', '11987654330', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 0, 10, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Kevin Souza', '11987654331', 'Jiu-Jitsu', 'Azul', '#0000FF', 'payment_issue', 1, 7, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Laura Pereira', '11987654332', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 3, 28, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Marcos Ribeiro', '11987654333', 'Jiu-Jitsu', 'Preta', '#000000', 'active', 0, 35, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Natalia Cardoso', '11987654334', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 2, 9, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Otavio Gomes', '11987654335', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 1, 14, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Patricia Dias', '11987654336', 'Jiu-Jitsu', 'Roxa', '#800080', 'payment_issue', 0, 6, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Quintino Barbosa', '11987654337', 'Jiu-Jitsu', 'Marrom', '#8B4513', 'active', 4, 32, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Rafaela Castro', '11987654338', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'active', 0, 11, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Samuel Araujo', '11987654339', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 2, 16, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Tatiana Moreira', '11987654340', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 3, 24, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Ulisses Teixeira', '11987654341', 'Jiu-Jitsu', 'Preta', '#000000', 'active', 1, 40, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Vanessa Correia', '11987654342', 'Jiu-Jitsu', 'Branca', '#FFFFFF', 'inactive', 0, 3, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Wagner Nunes', '11987654343', 'Jiu-Jitsu', 'Azul', '#0000FF', 'active', 1, 13, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Xavier Monteiro', '11987654344', 'Jiu-Jitsu', 'Roxa', '#800080', 'active', 2, 19, 15, 200),
((SELECT id FROM auth.users WHERE email = 'a@gmail.com'), 'Yasmin Freitas', '11987654345', 'Jiu-Jitsu', 'Marrom', '#8B4513', 'active', 4, 27, 15, 200);

-- Verificar total de alunos
SELECT COUNT(*) as total FROM students WHERE user_id = (SELECT id FROM auth.users WHERE email = 'a@gmail.com');
