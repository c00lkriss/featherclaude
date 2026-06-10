ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS xeno_canto_id text,
  ADD COLUMN IF NOT EXISTS xeno_canto_url text,
  ADD COLUMN IF NOT EXISTS xeno_canto_recordist text,
  ADD COLUMN IF NOT EXISTS xeno_canto_license text;