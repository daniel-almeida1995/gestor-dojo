
-- =============================================================================
-- SCRIPT DE SEGURANÇA MULTI-USUÁRIO (DEFINITIVO)
-- =============================================================================

-- 1. ALUNOS (students)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own students" ON students;
CREATE POLICY "Users can manage their own students" ON students
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. AULAS (classes)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own classes" ON classes;
CREATE POLICY "Users can manage their own classes" ON classes
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. CHAMADAS (attendance_records)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own attendance" ON attendance_records;
CREATE POLICY "Users can manage their own attendance" ON attendance_records
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. CONFIGURAÇÕES (organization_settings)
-- (Já aplicamos antes, mas reforçando)
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings" ON organization_settings;
CREATE POLICY "Users can manage their own settings" ON organization_settings
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. PAGAMENTOS (payments)
-- Proteção Indireta: Verifica se o aluno (student_id) pertence ao user logado.
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage payments of their students" ON payments;

CREATE POLICY "Users can manage payments of their students" ON payments
    FOR ALL
    USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

-- FIM DO SCRIPT
