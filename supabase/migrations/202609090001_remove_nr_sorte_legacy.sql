-- Migration: Descontinuação da coluna legada nr_sorte em t_participants
-- Os números da sorte agora residem de forma relacional na tabela t_draw_tickets (Multi-Sorteios).

-- 1. Remove constraint única legada de nr_sorte, caso exista
ALTER TABLE IF EXISTS public.t_participants DROP CONSTRAINT IF EXISTS uq_t_participants_nr_sorte;
ALTER TABLE IF EXISTS public.t_participants DROP CONSTRAINT IF EXISTS participants_lucky_number_key;

-- 2. Remove índice legado, caso exista
DROP INDEX IF EXISTS public.idx_participants_lucky_number;

-- 3. Remove a coluna legada nr_sorte
ALTER TABLE IF EXISTS public.t_participants DROP COLUMN IF EXISTS nr_sorte;
