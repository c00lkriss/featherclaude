-- Remove obsolete bootstrap admin function (admin account already exists)
REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC;
DROP FUNCTION IF EXISTS public.bootstrap_admin();

-- Ensure profiles SELECT policy is scoped to the row owner only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);