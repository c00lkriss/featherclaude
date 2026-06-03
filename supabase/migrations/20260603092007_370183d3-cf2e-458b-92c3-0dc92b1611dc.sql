
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  species_name text NOT NULL,
  common_name text,
  order_name text NOT NULL,
  family_name text NOT NULL,
  genus text,
  species_slug text NOT NULL UNIQUE,
  image_url text NOT NULL,
  thumbnail_url text,
  description text,
  location text,
  date_taken date,
  camera text,
  lens text,
  iso integer,
  aperture text,
  shutter_speed text,
  focal_length text,
  latitude numeric,
  longitude numeric,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  cover_image_url text,
  excerpt text,
  tags text[] DEFAULT '{}',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.taxonomy_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.taxonomy_orders TO authenticated;
GRANT ALL ON public.taxonomy_orders TO service_role;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read photos" ON public.photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can manage photos" ON public.photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Authenticated users can manage blog posts" ON public.blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read taxonomy orders" ON public.taxonomy_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can manage taxonomy orders" ON public.taxonomy_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
