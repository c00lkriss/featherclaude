-- Ensure photos location/geo columns exist (no-op if present)
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

-- eBird life list
CREATE TABLE IF NOT EXISTS public.ebird_lifelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_number integer,
  taxon_order integer,
  category text,
  common_name text,
  scientific_name text,
  obs_count text,
  location text,
  state_province text,
  date_observed date,
  location_id text,
  checklist_id text,
  exotic text,
  countable integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ebird_lifelist TO anon, authenticated;
GRANT INSERT, DELETE ON public.ebird_lifelist TO authenticated;
GRANT ALL ON public.ebird_lifelist TO service_role;

ALTER TABLE public.ebird_lifelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ebird lifelist"
  ON public.ebird_lifelist FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert ebird lifelist"
  ON public.ebird_lifelist FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ebird lifelist"
  ON public.ebird_lifelist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS ebird_lifelist_scientific_idx ON public.ebird_lifelist (scientific_name);
CREATE INDEX IF NOT EXISTS ebird_lifelist_category_countable_idx ON public.ebird_lifelist (category, countable);

-- eBird upload log
CREATE TABLE IF NOT EXISTS public.ebird_upload_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  total_count integer,
  countable_count integer,
  status text,
  notes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebird_upload_log TO authenticated;
GRANT ALL ON public.ebird_upload_log TO service_role;

ALTER TABLE public.ebird_upload_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read upload log"
  ON public.ebird_upload_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert upload log"
  ON public.ebird_upload_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update upload log"
  ON public.ebird_upload_log FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete upload log"
  ON public.ebird_upload_log FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));