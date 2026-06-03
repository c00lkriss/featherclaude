
-- Storage policies for the photos bucket (anyone can view; only admins can write)
CREATE POLICY "Photos are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Admins can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

-- Bootstrap function: the first signed-in user who calls this becomes admin
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_count int;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  RETURN public.has_role(uid, 'admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;
