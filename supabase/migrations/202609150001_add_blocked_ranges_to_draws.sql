-- Migration: Adiciona a coluna blocked_ranges na tabela t_draw_definitions
-- Permite configurar faixas ou números excluídos da geração (ex: '0445-0455, 0120')
ALTER TABLE IF EXISTS public.t_draw_definitions
ADD COLUMN IF NOT EXISTS blocked_ranges TEXT DEFAULT NULL;
