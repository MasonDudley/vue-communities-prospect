-- Allow authenticated admin users to delete specials
DROP POLICY IF EXISTS "authenticated_delete_specials" ON public.specials;
CREATE POLICY "authenticated_delete_specials"
  ON public.specials
  FOR DELETE
  TO authenticated
  USING (true);
