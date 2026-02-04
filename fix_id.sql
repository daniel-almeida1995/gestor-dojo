
-- Garantir que a coluna ID seja gerada automaticamente
ALTER TABLE organization_settings 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Garantir timestamps automáticos (opcional, mas bom)
ALTER TABLE organization_settings 
ALTER COLUMN created_at SET DEFAULT now();
