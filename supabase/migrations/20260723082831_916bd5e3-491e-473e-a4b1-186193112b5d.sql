ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS hero_story TEXT,
  ADD COLUMN IF NOT EXISTS hero_location TEXT;

ALTER TABLE public.photos
  ADD CONSTRAINT photos_hero_story_len CHECK (hero_story IS NULL OR char_length(hero_story) <= 80),
  ADD CONSTRAINT photos_hero_location_len CHECK (hero_location IS NULL OR char_length(hero_location) <= 40);