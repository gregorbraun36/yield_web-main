-- Storage bucket + policies for admin-managed contract documents.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-documents',
  'portfolio-documents',
  true,
  15728640,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "portfolio_documents_public_read" on storage.objects;
create policy "portfolio_documents_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'portfolio-documents');

drop policy if exists "portfolio_documents_admin_insert" on storage.objects;
create policy "portfolio_documents_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-documents'
    and public.is_admin((select auth.uid()))
  );

drop policy if exists "portfolio_documents_admin_update" on storage.objects;
create policy "portfolio_documents_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-documents'
    and public.is_admin((select auth.uid()))
  )
  with check (
    bucket_id = 'portfolio-documents'
    and public.is_admin((select auth.uid()))
  );

drop policy if exists "portfolio_documents_admin_delete" on storage.objects;
create policy "portfolio_documents_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-documents'
    and public.is_admin((select auth.uid()))
  );
