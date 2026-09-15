-- Migration: Adiciona a coluna permite_gerar_numero na tabela t_draw_definitions
-- Define se o sorteio permite gerar número no app ou se utiliza pulseira física presencial
ALTER TABLE public.t_draw_definitions 
ADD COLUMN IF NOT EXISTS permite_gerar_numero BOOLEAN DEFAULT TRUE;
