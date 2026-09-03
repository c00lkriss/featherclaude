ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS file_hash text;
CREATE INDEX IF NOT EXISTS photos_file_hash_idx ON public.photos (file_hash);