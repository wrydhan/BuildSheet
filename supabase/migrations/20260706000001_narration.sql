-- CarStory — narration layer (build spec §6 step 4).
-- Narration is DERIVED documentary copy. It lives in its own fields so it can be
-- regenerated (or the tone re-rolled) without ever touching the user's words
-- (`cars.raw_text`) or their corrected facts (`entries.notes`/`reasoning`).

-- The tone dial, persisted on the car so regeneration is consistent and the UI
-- can restore the last-used setting.
alter table public.cars
  add column tone text not null default 'enthusiast'
    check (tone in ('straight', 'enthusiast', 'full_documentary'));

-- The overall documentary narration for the whole build. Null until generated.
alter table public.cars
  add column narration text;

-- Per-entry documentary line. Null until generated (or when the entry is bare).
alter table public.entries
  add column narration text;
