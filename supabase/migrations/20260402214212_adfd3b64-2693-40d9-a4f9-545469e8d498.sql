-- Remover políticas RLS
DROP POLICY IF EXISTS "SuperAdmin can manage botconversa config" ON botconversa_config;
DROP POLICY IF EXISTS "Org members can view botconversa config" ON botconversa_config;
DROP POLICY IF EXISTS "Membros da organização podem ver configs botconversa" ON public.botconversa_config;
DROP POLICY IF EXISTS "Membros da organização podem gerenciar configs botconversa" ON public.botconversa_config;
DROP POLICY IF EXISTS "botconversa_config_all" ON public.botconversa_config;

-- Remover tabela
DROP TABLE IF EXISTS botconversa_config CASCADE;

-- Remover coluna botconversa_message_id de scheduled_messages se existir
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scheduled_messages' AND column_name='botconversa_message_id') THEN
        ALTER TABLE scheduled_messages DROP COLUMN botconversa_message_id;
    END IF;
END $$;