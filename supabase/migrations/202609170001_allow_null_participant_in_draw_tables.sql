-- Migration: Permite id_participante nulo para sorteios fisicos/senhas/pulseiras sem participantes cadastrados vinculados
ALTER TABLE public.t_draw_winners ALTER COLUMN id_participante DROP NOT NULL;
ALTER TABLE public.t_draws ALTER COLUMN id_participante DROP NOT NULL;
