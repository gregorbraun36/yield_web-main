-- Edge Functions (service_role) kullanarak e-postadan auth kullanıcı id'sini bulmak için.
-- createUser başarısız olunca (duplicate email) mevcut kullanıcıyı yeniden provisioning için gerekli.

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth
STABLE
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(trim(coalesce(email, ''))) = lower(trim(coalesce(p_email, '')))
  ORDER BY created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;
