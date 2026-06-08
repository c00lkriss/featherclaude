
ALTER TABLE public.ebird_lifelist
  ADD COLUMN IF NOT EXISTS ebird_lat numeric,
  ADD COLUMN IF NOT EXISTS ebird_long numeric;

CREATE INDEX IF NOT EXISTS ebird_lifelist_coords_idx
  ON public.ebird_lifelist (ebird_lat, ebird_long)
  WHERE ebird_lat IS NOT NULL;

-- Backfill: extract coordinates from "Auto selected 32.61616, 74.74960" style strings
UPDATE public.ebird_lifelist
SET
  ebird_lat = NULLIF((regexp_match(location, '(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)'))[1], '')::numeric,
  ebird_long = NULLIF((regexp_match(location, '(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)'))[2], '')::numeric
WHERE ebird_lat IS NULL
  AND location ~ '-?\d+\.\d+\s*,\s*-?\d+\.\d+';
