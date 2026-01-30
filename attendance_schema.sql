-- ============================================
-- MÓDULO 1: SISTEMA DE PRESENÇA COMPLETO
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Atualizar tabela classes com campos de presença
ALTER TABLE classes ADD COLUMN IF NOT EXISTS students_checked_in jsonb DEFAULT '[]'::jsonb;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS max_capacity int DEFAULT 20;

-- 2. Criar tabela de registros de presença
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  checked_in_at timestamp with time zone DEFAULT now(),
  checked_out_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);

-- 4. Habilitar RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 5. Criar política de acesso
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendance_records' 
    AND policyname = 'Usuários gerenciam suas próprias presenças'
  ) THEN
    CREATE POLICY "Usuários gerenciam suas próprias presenças"
    ON attendance_records FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Função auxiliar: Obter estatísticas de presença de um aluno
CREATE OR REPLACE FUNCTION get_student_attendance_stats(
  p_student_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS TABLE (
  total_classes bigint,
  attendance_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_classes,
    ROUND((COUNT(*)::numeric / NULLIF(
      (SELECT COUNT(*) FROM classes 
       WHERE date BETWEEN p_start_date AND p_end_date 
       AND user_id = (SELECT user_id FROM students WHERE id = p_student_id)
      ), 0
    )) * 100, 2) as attendance_percentage
  FROM attendance_records
  WHERE student_id = p_student_id
    AND checked_in_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificar se tudo foi criado
SELECT 
  'attendance_records criada!' as status,
  COUNT(*) as total_records
FROM attendance_records;
