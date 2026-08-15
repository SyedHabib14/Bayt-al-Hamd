-- Allows the server to verify a CNIC with the publishable key without exposing
-- the users table. The function deliberately returns only one matching row.
CREATE OR REPLACE FUNCTION public.authenticate_cnic(input_cnic TEXT)
RETURNS TABLE (id UUID, cnic TEXT, full_name TEXT, role public.app_role, is_active BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.cnic, u.full_name, u.role, u.is_active
  FROM public.users AS u
  WHERE u.cnic = regexp_replace(input_cnic, '[-[:space:]]', '', 'g')
    AND u.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.authenticate_cnic(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.authenticate_cnic(TEXT) TO anon, authenticated;
