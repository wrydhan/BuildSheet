-- Row Level Security. The security model (build spec §10):
--   * Owners can CRUD only their own car and its children.
--   * Anonymous (and any) viewers can SELECT a car only when is_public = true.
--     The share_slug match happens in the query; this policy is the hard
--     guarantee that a private car can never be read by a non-owner.
--
-- auth.uid() is wrapped in (select ...) so Postgres evaluates it once per query
-- rather than per row (RLS performance best practice).

alter table public.users enable row level security;
alter table public.cars enable row level security;
alter table public.entries enable row level security;
alter table public.templates enable row level security;
alter table public.posters enable row level security;
alter table public.callouts enable row level security;

-- users: a user sees and edits only their own row. Inserts happen via the
-- signup trigger (security definer), so no client insert policy is needed.
create policy "users_self_select" on public.users
  for select to authenticated
  using (id = (select auth.uid()));

create policy "users_self_update" on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- cars: owner full CRUD.
create policy "cars_owner_all" on public.cars
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- cars: anyone (anon or logged-in) may read a public car.
create policy "cars_public_read" on public.cars
  for select
  using (is_public = true);

-- Helper predicate reused by child tables: does the current user own this car,
-- or is the car public?
--   owner  -> full access (checked per statement below)
--   public -> read-only

-- entries
create policy "entries_owner_all" on public.entries
  for all to authenticated
  using (
    exists (
      select 1 from public.cars c
      where c.id = entries.car_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cars c
      where c.id = entries.car_id and c.user_id = (select auth.uid())
    )
  );

create policy "entries_public_read" on public.entries
  for select
  using (
    exists (
      select 1 from public.cars c
      where c.id = entries.car_id and c.is_public = true
    )
  );

-- posters
create policy "posters_owner_all" on public.posters
  for all to authenticated
  using (
    exists (
      select 1 from public.cars c
      where c.id = posters.car_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cars c
      where c.id = posters.car_id and c.user_id = (select auth.uid())
    )
  );

create policy "posters_public_read" on public.posters
  for select
  using (
    exists (
      select 1 from public.cars c
      where c.id = posters.car_id and c.is_public = true
    )
  );

-- callouts (joined to their poster's car)
create policy "callouts_owner_all" on public.callouts
  for all to authenticated
  using (
    exists (
      select 1 from public.posters p
      join public.cars c on c.id = p.car_id
      where p.id = callouts.poster_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.posters p
      join public.cars c on c.id = p.car_id
      where p.id = callouts.poster_id and c.user_id = (select auth.uid())
    )
  );

create policy "callouts_public_read" on public.callouts
  for select
  using (
    exists (
      select 1 from public.posters p
      join public.cars c on c.id = p.car_id
      where p.id = callouts.poster_id and c.is_public = true
    )
  );

-- templates: readable by everyone (they are style definitions, not user data);
-- writes are admin-only (service role bypasses RLS). No public write policy.
create policy "templates_read_all" on public.templates
  for select
  using (true);
