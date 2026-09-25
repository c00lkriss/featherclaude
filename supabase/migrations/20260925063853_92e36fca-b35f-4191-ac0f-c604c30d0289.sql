ALTER TABLE public.ebird_lifelist ADD COLUMN IF NOT EXISTS is_new_lifer boolean DEFAULT false;
ALTER TABLE public.ebird_upload_log ADD COLUMN IF NOT EXISTS new_lifer_count integer DEFAULT 0;
GRANT UPDATE ON public.ebird_lifelist TO authenticated;
CREATE POLICY "Admins can update ebird lifelist" ON public.ebird_lifelist FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));