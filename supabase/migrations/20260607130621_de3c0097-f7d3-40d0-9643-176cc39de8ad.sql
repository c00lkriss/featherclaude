
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS species_identifier text;

UPDATE public.photos SET species_identifier = species_slug WHERE species_identifier IS NULL;

ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_species_slug_key;
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_species_slug_unique;

UPDATE public.photos
SET species_slug = species_identifier || '-' || substr(md5(random()::text || id::text), 1, 4)
WHERE species_slug = species_identifier;

ALTER TABLE public.photos ALTER COLUMN species_identifier SET NOT NULL;

CREATE INDEX IF NOT EXISTS photos_species_identifier_idx ON public.photos (species_identifier);
CREATE UNIQUE INDEX IF NOT EXISTS photos_species_slug_unique_idx ON public.photos (species_slug);
