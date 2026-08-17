-- CarStory — let a car's owner write poster images to the public `posters`
-- bucket (build spec §6 image layer + §7 public page).
--
-- Why the public bucket (not private car-photos): the share page is viewed with
-- no account, so poster images must be publicly readable without signed URLs.
-- Storing them here — scoped by a `{car_id}/…` path the owner controls — keeps
-- in-app and public rendering identical and auth-free on read. Public read of
-- this bucket already exists (20260701000003). These policies add owner write.
--
-- Note: this makes any image the user attaches to a poster world-readable by URL
-- (paths are unguessable, but not secret). That matches the product: posters are
-- meant to be shared. Truly private originals can live in `car-photos` later.

create policy "posters_bucket_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'posters'
    and exists (
      select 1 from public.cars c
      where c.id::text = (storage.foldername(name))[1]
        and c.user_id = (select auth.uid())
    )
  );

create policy "posters_bucket_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'posters'
    and exists (
      select 1 from public.cars c
      where c.id::text = (storage.foldername(name))[1]
        and c.user_id = (select auth.uid())
    )
  );

create policy "posters_bucket_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'posters'
    and exists (
      select 1 from public.cars c
      where c.id::text = (storage.foldername(name))[1]
        and c.user_id = (select auth.uid())
    )
  );
