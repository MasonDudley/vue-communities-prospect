-- Add storage bucket and policies for specials promo image uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'specials-assets',
  'specials-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_specials_assets" on storage.objects;
create policy "public_read_specials_assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'specials-assets');

drop policy if exists "authenticated_upload_specials_assets" on storage.objects;
create policy "authenticated_upload_specials_assets"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'specials-assets');

drop policy if exists "authenticated_update_specials_assets" on storage.objects;
create policy "authenticated_update_specials_assets"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'specials-assets')
  with check (bucket_id = 'specials-assets');
