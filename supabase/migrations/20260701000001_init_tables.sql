-- CarStory — initial schema (build spec §5).
-- Full v1 relational model created up front so future features (multi-car,
-- posters, community templates) are lifted limits, not migrations.

-- URL-safe random slug generator (never expose sequential ids publicly).
create or replace function public.gen_share_slug(len int default 12)
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  bytes bytea := gen_random_bytes(len);
  result text := '';
  i int;
begin
  for i in 0..len - 1 loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return result;
end;
$$;

-- users — mirrors auth.users; populated by trigger on signup.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- cars — one per account in v1 (enforced in app, relational in DB).
create table public.cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  year int,
  make text,
  model text,
  trim text,
  nickname text,
  color text,
  mileage int,
  -- The user's original freeform paragraph: source of truth, stored verbatim.
  -- Derived fields (entries, narration) never overwrite this. The parsing
  -- pipeline only ever reads it.
  raw_text text not null default '',
  is_public boolean not null default false,
  share_slug text not null unique default public.gen_share_slug(12),
  created_at timestamptz not null default now()
);

-- entries — unified mods + services, derived from raw_text and editable.
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  type text not null check (type in ('mod', 'service')),
  title text not null,
  category text,
  brand text,
  cost numeric,
  -- Kept as text to preserve the user's phrasing ("last spring") without
  -- fabricating a precision they did not provide.
  date text,
  mileage int,
  notes text,      -- factual details, AI-sorted
  reasoning text,  -- the "why", AI-sorted
  created_at timestamptz not null default now()
);

-- templates — the style library the AI matches against (populated in a later pass).
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style text not null,
  layout jsonb,
  text_capacity text,        -- 'low' | 'medium' | 'high'
  callout_count int,
  image_mode text check (image_mode in ('hero', 'detail')),
  mood text[],
  is_flexible_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

-- posters — one designed facet of a car's "magazine".
create table public.posters (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  facet text not null,
  image_url text,
  image_source text check (image_source in ('upload', 'stock', 'generated')),
  display_order int not null default 0,  -- spec's `order`; renamed to avoid the reserved word
  created_at timestamptz not null default now()
);

-- callouts — slot-based annotations (no pixel pinning).
create table public.callouts (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.posters (id) on delete cascade,
  entry_id uuid references public.entries (id) on delete set null,
  label text,
  narration text,
  slot text,
  kind text not null check (kind in ('entry', 'info')),
  created_at timestamptz not null default now()
);
