-- Make admin activity feed actually usable:
-- - authenticated users can insert own activity events
-- - admins can read the feed
-- - table is published to realtime for live updates

alter table public.admin_activity_feed enable row level security;

drop policy if exists "authenticated_insert_activity_feed" on public.admin_activity_feed;
create policy "authenticated_insert_activity_feed"
  on public.admin_activity_feed
  for insert
  to authenticated
  with check (
    user_id is null or user_id = auth.uid()
  );

drop policy if exists "admins_select_activity_feed" on public.admin_activity_feed;
create policy "admins_select_activity_feed"
  on public.admin_activity_feed
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_activity_feed'
  ) then
    execute 'alter publication supabase_realtime add table public.admin_activity_feed';
  end if;
end;
$$;
