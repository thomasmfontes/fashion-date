-- Fashion Date — Supabase Auth & Social Login Integration
-- Adds support for linking participants to their authenticated Supabase account (Google / Microsoft).

ALTER TABLE public.t_participants 
  ADD COLUMN IF NOT EXISTS ds_email TEXT;

ALTER TABLE public.t_participants 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

CREATE INDEX IF NOT EXISTS ix_t_participants_ds_email 
  ON public.t_participants (ds_email);

CREATE INDEX IF NOT EXISTS ix_t_participants_auth_user_id 
  ON public.t_participants (auth_user_id);