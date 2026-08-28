-- Ensure admins can manage application rows (including delete).
-- This migration is defensive: it only runs policy statements if the table exists.

do $$
begin
  if to_regclass('public.applications') is null then
    return;
  end if;

  execute 'drop policy if exists "applications_select_admin" on public.applications';
  execute '
    create policy "applications_select_admin"
      on public.applications
      for select
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = ''admin''
        )
      )';

  execute 'drop policy if exists "applications_update_admin" on public.applications';
  execute '
    create policy "applications_update_admin"
      on public.applications
      for update
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = ''admin''
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = ''admin''
        )
      )';

  execute 'drop policy if exists "applications_delete_admin" on public.applications';
  execute '
    create policy "applications_delete_admin"
      on public.applications
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = ''admin''
        )
      )';
end
$$;
