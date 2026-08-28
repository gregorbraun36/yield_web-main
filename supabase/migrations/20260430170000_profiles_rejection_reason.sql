-- Trigger/Logik 'NEW.rejection_reason' bekliyorsa hata vermesin.
alter table if exists public.profiles
  add column if not exists rejection_reason text;

comment on column public.profiles.rejection_reason is 'Optional reason when status is rejected (admin UI).';
