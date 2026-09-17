-- Migration: Adiciona coluna ds_avatar_url e configura bucket de avatars no Supabase Storage

-- 1. Coluna de avatar na tabela de participantes
ALTER TABLE IF EXISTS public.t_participants
  ADD COLUMN IF NOT EXISTS ds_avatar_url TEXT;

-- 2. Bucket 'avatars' no Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

-- 3. Políticas de RLS no storage.objects para o bucket 'avatars'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Avatars'
  ) THEN
    CREATE POLICY "Public Access Avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Upload Avatars'
  ) THEN
    CREATE POLICY "Allow Upload Avatars" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Update Avatars'
  ) THEN
    CREATE POLICY "Allow Update Avatars" ON storage.objects
      FOR UPDATE USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Delete Avatars'
  ) THEN
    CREATE POLICY "Allow Delete Avatars" ON storage.objects
      FOR DELETE USING (bucket_id = 'avatars');
  END IF;
END $$;
