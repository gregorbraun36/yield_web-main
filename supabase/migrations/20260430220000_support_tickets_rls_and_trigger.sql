-- Support tickets: columns used by admin UI, unread counters, RLS, and message trigger.

alter table if exists public.support_tickets
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists unread_admin_count integer not null default 0,
  add column if not exists unread_user_count integer not null default 0;

create index if not exists idx_support_tickets_user on public.support_tickets(user_id, last_message_at desc);

-- Keep ticket metadata in sync when new messages arrive (bypasses RLS as SECURITY DEFINER).
create or replace function public.support_ticket_message_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets
  set
    last_message_at = now(),
    unread_admin_count = case
      when new.sender_role = 'user' then coalesce(unread_admin_count, 0) + 1
      else coalesce(unread_admin_count, 0)
    end,
    unread_user_count = case
      when new.sender_role = 'admin' then coalesce(unread_user_count, 0) + 1
      else coalesce(unread_user_count, 0)
    end
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists trg_support_ticket_message_after_insert on public.support_ticket_messages;
create trigger trg_support_ticket_message_after_insert
  after insert on public.support_ticket_messages
  for each row execute function public.support_ticket_message_after_insert();

-- RLS policies (RLS was enabled without policies in initial migration).

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
  on public.support_tickets for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "support_tickets_select_admin" on public.support_tickets;
create policy "support_tickets_select_admin"
  on public.support_tickets for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
  on public.support_tickets for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "support_tickets_update_own" on public.support_tickets;
create policy "support_tickets_update_own"
  on public.support_tickets for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "support_tickets_update_admin" on public.support_tickets;
create policy "support_tickets_update_admin"
  on public.support_tickets for update to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "support_tickets_delete_admin" on public.support_tickets;
create policy "support_tickets_delete_admin"
  on public.support_tickets for delete to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "support_messages_select" on public.support_ticket_messages;
create policy "support_messages_select"
  on public.support_ticket_messages for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    or exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = (select auth.uid())
    )
  );

drop policy if exists "support_messages_insert_user" on public.support_ticket_messages;
create policy "support_messages_insert_user"
  on public.support_ticket_messages for insert to authenticated
  with check (
    sender_role = 'user'
    and sender_user_id = (select auth.uid())
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = (select auth.uid())
    )
  );

drop policy if exists "support_messages_insert_admin" on public.support_ticket_messages;
create policy "support_messages_insert_admin"
  on public.support_ticket_messages for insert to authenticated
  with check (
    sender_role = 'admin'
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    and exists (select 1 from public.support_tickets t where t.id = ticket_id)
  );

drop policy if exists "support_messages_delete_admin" on public.support_ticket_messages;
create policy "support_messages_delete_admin"
  on public.support_ticket_messages for delete to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- Optional: Dashboard → Database → Replication → add `support_ticket_messages` to the `supabase_realtime`
-- publication for live chat updates without manual refresh.
