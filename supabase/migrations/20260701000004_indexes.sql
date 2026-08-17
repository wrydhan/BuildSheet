-- Indexes. share_slug already has a unique index from its UNIQUE constraint
-- (serves public share-link lookups). Add btree indexes on every foreign key.

create index if not exists cars_user_id_idx on public.cars (user_id);
create index if not exists entries_car_id_idx on public.entries (car_id);
create index if not exists posters_car_id_idx on public.posters (car_id);
create index if not exists posters_template_id_idx on public.posters (template_id);
create index if not exists callouts_poster_id_idx on public.callouts (poster_id);
create index if not exists callouts_entry_id_idx on public.callouts (entry_id);
