-- Script SQL Incremental - Só cria o que está faltando
-- Execute no SQL Editor do Supabase

-- 1. Criar tabela organization_settings (se não existir)
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  school_name text DEFAULT 'Minha Escola',
  logo_url text,
  default_monthly_fee numeric DEFAULT 150.00,
  default_due_day int DEFAULT 10,
  currency_symbol text DEFAULT 'R$',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar RLS para organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para organization_settings (com verificação)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_settings' 
    AND policyname = 'Usuários gerenciam suas próprias configurações'
  ) THEN
    CREATE POLICY "Usuários gerenciam suas próprias configurações"
    ON organization_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Adicionar colunas na tabela students (se não existirem)
ALTER TABLE students ADD COLUMN IF NOT EXISTS due_day int DEFAULT 10;
ALTER TABLE students ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 150.00;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_payment_date timestamp with time zone;

-- 5. Recarregar cache do Supabase
NOTIFY pgrst, 'reload schema cache';

-- Verificar se tudo foi criado corretamente
SELECT 'organization_settings criada!' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_settings');
