-- Allow deleting rows in auth.users (Dashboard / Studio) without FK violations.
-- Initial provisioning migration used REFERENCES auth.users(id) without ON DELETE,
-- defaulting to NO ACTION which blocks deletes.
--
-- 1) Fix known constraint names explicitly (deterministic reruns).
-- 2) Any remaining single-column FKs from public.* -> auth.users with NO ACTION / RESTRICT
--    become ON DELETE CASCADE, or SET NULL where the FK column is nullable and looks like audit/sender refs.

alter table public.admin_audit_events drop constraint if exists admin_audit_events_actor_user_id_fkey;
alter table public.admin_audit_events
  add constraint admin_audit_events_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete set null;

alter table public.admin_audit_events drop constraint if exists admin_audit_events_target_user_id_fkey;
alter table public.admin_audit_events
  add constraint admin_audit_events_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete set null;

alter table public.admin_activity_feed drop constraint if exists admin_activity_feed_user_id_fkey;
alter table public.admin_activity_feed
  add constraint admin_activity_feed_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.support_tickets drop constraint if exists support_tickets_user_id_fkey;
alter table public.support_tickets
  add constraint support_tickets_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.support_ticket_messages drop constraint if exists support_ticket_messages_sender_user_id_fkey;
alter table public.support_ticket_messages
  add constraint support_ticket_messages_sender_user_id_fkey
  foreign key (sender_user_id) references auth.users(id) on delete set null;

alter table public.portfolio_contracts drop constraint if exists portfolio_contracts_user_id_fkey;
alter table public.portfolio_contracts
  add constraint portfolio_contracts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

do $$
declare
  r record;
  action text;
begin
  for r in
    select c.conname, n.nspname as tbl_schema, cl.relname as tbl_name, a.attname as col_name,
           a.attnotnull as col_not_null
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = (c.conkey)[1]
     where c.contype = 'f'
       and c.confrelid = 'auth.users'::regclass
       and array_length(c.conkey, 1) = 1
       and c.confdeltype in ('a', 'r') -- NO ACTION / RESTRICT
       and n.nspname = 'public'
    loop
      if lower(r.col_name) in (
        'actor_user_id', 'target_user_id', 'sender_user_id', 'created_by_user_id'
      )
         and r.col_not_null = false then
        action := 'set null';
      else
        action := 'cascade';
      end if;

      execute format(
        'alter table %I.%I drop constraint %I',
        r.tbl_schema, r.tbl_name, r.conname
      );

      execute format(
        'alter table %I.%I add constraint %I foreign key (%I) references auth.users(id) on delete ',
        r.tbl_schema, r.tbl_name, r.conname, r.col_name
      )
        || case when action = 'set null' then 'set null' else 'cascade' end;
    end loop;
end;
$$;
