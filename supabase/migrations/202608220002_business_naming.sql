-- Fashion Date — corporate naming convention.
-- This migration only renames objects; it does not delete or rewrite records.

ALTER TABLE public.participants RENAME TO t_participants;
ALTER TABLE public.t_participants RENAME COLUMN id TO id_participante;
ALTER TABLE public.t_participants RENAME COLUMN lucky_number TO nr_sorte;
ALTER TABLE public.t_participants RENAME COLUMN name TO nm_participante;
ALTER TABLE public.t_participants RENAME COLUMN store TO nm_loja;
ALTER TABLE public.t_participants RENAME COLUMN phone TO nr_whatsapp;
ALTER TABLE public.t_participants RENAME COLUMN instagram TO nm_instagram;
ALTER TABLE public.t_participants RENAME COLUMN status TO st_participante;
ALTER TABLE public.t_participants RENAME COLUMN created_at TO dt_cadastro;

ALTER TABLE public.settings RENAME TO t_settings;
ALTER TABLE public.t_settings RENAME COLUMN key TO cd_configuracao;
ALTER TABLE public.t_settings RENAME COLUMN value TO vl_configuracao;

ALTER TABLE public.draws RENAME TO t_draws;
ALTER TABLE public.t_draws RENAME COLUMN id TO id_sorteio;
ALTER TABLE public.t_draws RENAME COLUMN participant_id TO id_participante;
ALTER TABLE public.t_draws RENAME COLUMN lucky_number TO nr_sorte;
ALTER TABLE public.t_draws RENAME COLUMN drawn_at TO dt_sorteio;

ALTER TABLE public.request_rate_limits RENAME TO t_request_rate_limits;
ALTER TABLE public.t_request_rate_limits RENAME COLUMN key TO cd_chave;
ALTER TABLE public.t_request_rate_limits RENAME COLUMN window_started_at TO dt_inicio_janela;
ALTER TABLE public.t_request_rate_limits RENAME COLUMN request_count TO qt_requisicoes;

ALTER TABLE public.t_participants RENAME CONSTRAINT participants_pkey TO pk_t_participants;
ALTER TABLE public.t_participants RENAME CONSTRAINT participants_lucky_number_key TO uq_t_participants_nr_sorte;
ALTER TABLE public.t_participants RENAME CONSTRAINT participants_phone_key TO uq_t_participants_nr_whatsapp;
ALTER INDEX public.idx_participants_status RENAME TO ix_t_participants_st_participante;

ALTER TABLE public.t_settings RENAME CONSTRAINT settings_pkey TO pk_t_settings;

ALTER TABLE public.t_draws RENAME CONSTRAINT draws_pkey TO pk_t_draws;
ALTER TABLE public.t_draws RENAME CONSTRAINT draws_participant_id_fkey TO fk_t_draws_participante;
ALTER INDEX public.idx_draws_participant_id RENAME TO ix_t_draws_id_participante;

ALTER TABLE public.t_request_rate_limits RENAME CONSTRAINT request_rate_limits_pkey TO pk_t_request_rate_limits;
