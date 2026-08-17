-- Storage buckets (used from a later pass; created now so the schema is complete).
--   car-photos: private; owner-scoped by a `{user_id}/...` path convention.
--   posters:    public read; written only by the render Edge Function (service role).

insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

-- car-photos: a user may read/write only objects under their own user-id folder.
create policy "car_photos_owner_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'car-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "car_photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'car-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "car_photos_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'car-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "car_photos_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'car-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- posters: public bucket, so anyone can read. Writes are done by the service
-- role (which bypasses RLS), so no client insert/update policy is defined.
create policy "posters_public_read" on storage.objects
  for select
  using (bucket_id = 'posters');
