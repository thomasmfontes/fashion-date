-- Migration: Adiciona a coluna nm_cidade na tabela t_participants
ALTER TABLE IF EXISTS public.t_participants
ADD COLUMN IF NOT EXISTS nm_cidade TEXT;
