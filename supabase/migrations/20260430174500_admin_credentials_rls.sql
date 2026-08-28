-- admin_provisioned_credentials RLS vardı ama politikası yoktu;
-- authenticated admin bile SELECT yapamayınca .single() JSON hatası veriyordu.

drop policy if exists "admins_select_provisioned_credentials" on public.admin_provisioned_credentials;

create policy "admins_select_provisioned_credentials"
  on public.admin_provisioned_credentials
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
