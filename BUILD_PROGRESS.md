# CarStory — build progress

Tracks the build against the spec's build order (§9). Update as steps land.

## Done

- **1. Skeleton + auth.** Expo (RN) app in `apps/mobile`, Supabase project in
  `supabase/`. Email/password auth with protected route groups
  (`(auth)` / `(app)`), session persistence (AsyncStorage native, localStorage web).
- **Data model (§5).** All v1 tables + RLS + storage buckets + indexes, in
  `supabase/migrations/`. `share_slug` generator; owner-CRUD + public-read policies.
- **Parsing engine (§11, "first artifact").** Shared zod contract in
  `packages/shared` (segment/extract), OpenAI **and** Gemini structured-output
  adapters, prompts with anti-fabrication rules, edge functions
  `pipeline-segment` / `pipeline-extract` (with tmp_id reconciliation), plus
  unit + live tests in `supabase/functions/_tests/`.
- **2. Add-car form.** `useCar` / `useUpsertCar` (`apps/mobile/src/lib/cars.ts`),
  add/edit form (`(app)/car-form.tsx`), garage shows the car (`(app)/index.tsx`).
  One car per account (enforced in the data layer).
- **3. Freeform → parse → review → entries.**
  - Orchestrator edge function `parse-build`: authenticated (runs under caller
    RLS), saves verbatim `raw_text`, runs segment→extract, returns entries **for
    review without persisting them**.
  - Client: `lib/parse.ts` (invoke + draft), `lib/entries.ts` (query + replace-save).
  - Screens: `(app)/build.tsx` (freeform input), `(app)/review.tsx` (the ★ review
    checkpoint — edit/add/remove entries, then commit). Garage lists committed entries.

- **4. Narration + tone dial.**
  - Migration `20260706000001_narration.sql`: `cars.tone` (checked dial, default
    `enthusiast`), `cars.narration` (overall), `entries.narration` (per-entry) —
    all derived fields, separate from user content.
  - Shared: narrate zod schema + OpenAI/Gemini JSON schemas + `narrate.ts` prompt
    (tone dial + strict anti-fabrication rules).
  - Edge function `narrate`: authenticated, reads reviewed entries, assigns short
    keys (e1…) → real UUIDs, calls the model warm (temp scales with tone),
    reconciles by key, persists narration. Runs post-review, freely regenerable.
  - Client `lib/narrate.ts`; screen `(app)/narrate.tsx` (tone selector + generate/
    regenerate + overall & per-entry display). Garage links to it once entries exist.
  - Tests: `_tests/narrate.unit.test.ts` (key reconciliation, missing/hallucinated
    keys, zero entries, malformed output) — all pass.

- **5. Template library + selection.**
  - Shared `templates/`: `TemplateMeta`/`TemplateLayout`/`SelectionCriteria`
    types + `selectTemplate()` scoring engine. Every template is scored; the
    flexible fallback is authored to score neutrally so it wins only when nothing
    specialized fits (no magic threshold). Style preference is a strong boost.
  - Migration `20260706000002_seed_templates.sql`: 4 specialized styles
    (magazine_cover, 90s_jdm, modern_minimal, infographic_deep_dive) + 1 flexible
    fallback, fixed UUIDs + upsert (idempotent). `layout` jsonb carries design
    tokens (palette/fonts/imageFrame/sections) for the step-6 renderer.
  - Client `lib/templates.ts` (`useTemplates`). Tests
    `_tests/templates.unit.test.ts` (preference, fallback-on-no-image, deep-dive
    fit, specialized-beats-fallback, empty) — all pass.

- **6. Facets → poster compose + on-screen render.**
  - Shared `posters/`: `facets.ts` (facet catalog, category→facet folding,
    `suggestFacets`) + `compose.ts` (`selectFacetEntries` richest-win capping,
    `composeCallouts`, `criteriaForFacet`). Pure + tested.
  - Edge function `compose-poster`: authenticated; gathers facet entries →
    derives criteria → `selectTemplate` (fallback-aware) → caps to the template's
    slots → replaces any existing poster for that facet → persists poster +
    callouts. Image layer optional (graceful degradation).
  - Client `lib/posters.ts`, `lib/facets.ts` (client mirror), `lib/templates.ts`.
  - UI: `components/poster-view.tsx` (native magazine render from template design
    tokens + callouts), `(app)/create-poster.tsx` (facet picker w/ counts + style
    preference + photo), `(app)/posters.tsx` (magazine list). Garage links in.
  - Tests `_tests/posters.unit.test.ts` — all pass. **24 function tests total.**

- **6b. Photo upload.** `expo-image-picker` → `lib/photos.ts` uploads to the
  PUBLIC `posters` bucket at `{car_id}/…` (migration
  `20260707000001_posters_bucket_owner_write.sql` adds owner insert/update/delete
  policies). Returns a public URL — works in-app AND on the auth-less share page
  with no signed-URL plumbing. Wired into `create-poster` (optional photo);
  `compose-poster` stores it as `image_url` + `image_source='upload'`.

- **6c. Shareable PNG.** `components/sharable-poster.tsx` rasterizes the on-screen
  poster with `react-native-view-shot` → OS share sheet via `expo-sharing`.
  Native only (web hides the button; web shares the public link instead).

- **7. Public web car page + share link.**
  - `lib/public.ts` (`usePublicCar` by slug, anon read via `*_public_read` RLS),
    public route `app/c/[slug].tsx` (registered OUTSIDE the auth gate in
    `_layout.tsx`), renders identity + narration + posters + "build your own" CTA.
  - Privacy toggle + share link: `useSetCarPublic` + `shareUrl()` in `cars.ts`,
    `ShareSection` in the garage (Switch + native Share of `EXPO_PUBLIC_WEB_URL/c/<slug>`).

- **8. Universal Links / App Links.** `app.json`: iOS `associatedDomains`
  (`applinks:carstory.app`) + Android verified `intentFilters` for `/c` +
  `expo-image-picker` photo-permission string. expo-router maps the path to the
  `c/[slug]` route automatically.

**→ Step 9: shippable MVP — feature-complete. Remaining is runtime bring-up (below).**

## Next (in order)

- **Runtime bring-up (user):** apply migrations (`pnpm sb:reset` / push), set
  Edge Function secrets (`GEMINI_API_KEY` or `OPENAI_API_KEY`), fill
  `apps/mobile/.env` (incl. `EXPO_PUBLIC_WEB_URL`), deploy functions, `expo
  prebuild` + dev build (native modules: image-picker, view-shot, sharing), test
  the full loop on device/TestFlight.
- **Replace the placeholder domain** `carstory.app` everywhere (app.json ×2,
  .env, migration comments) with the real domain, and host the AASA
  (`/.well-known/apple-app-site-association`) + `assetlinks.json` files.
- **10 (post-v1):** Android launch, AI image generation (+cache), stock library,
  multi-car, community templates.

## Notes / conventions

- AI runs server-side only; keys never in the client bundle.
- User's words are source of truth; derived fields live separately and are
  regenerable. Entries use replace-on-save from the review screen (v1).
- No commits yet — repo is all working-tree.
- `deno` lives at `~/.deno/bin/deno` (not on PATH). Run tests with
  `PATH="$HOME/.deno/bin:$PATH" pnpm test:functions`. Type-check functions with
  `deno check --config supabase/functions/deno.json supabase/functions/**/index.ts`.
  The `test:functions` script uses `--no-check`, so it will NOT catch type errors
  — run `deno check` separately (it caught an unimported-type bug in
  `_shared/openai.ts`, now fixed).
- Re-parsing replaces entries (delete+insert), which drops their narration; the
  narration is then regenerable from the narrate screen. Fine for v1.
- Docker/Supabase-local are NOT available in this environment, so migrations have
  NOT been applied to a real Postgres — all migration SQL is reviewed but
  DB-unvalidated (incl. narration, seed-templates, posters-bucket policies). Run
  `pnpm sb:reset` where Docker exists.
- No simulator/device this session: mobile is fully type-checked (strict tsc,
  typedRoutes) but not run. Native features (photo pick, view-shot capture,
  sharing) and the poster/public flows are code-complete but unexercised.
- Photos go to the PUBLIC `posters` bucket (see 6b) — a deliberate choice so the
  share page needs no signed URLs. `car-photos` (private) is unused in v1.
- Shared code lives at `supabase/functions/_shared/shared/` (NOT a top-level
  `packages/shared` anymore). Reason: Supabase's remote function bundler can only
  include files under `supabase/functions/`, so the old cross-dir alias
  (`../../packages/shared/src`) failed to deploy. The `@carstory/shared/` alias in
  `supabase/functions/deno.json` now maps to `./_shared/shared/` (in-tree); all
  imports are unchanged. It's a backend-only lib — the mobile app duplicates the
  handful of types it needs and never imports it.
- No-key testing: `LLM_PROVIDER=mock` (cloud secret or functions/.env) runs
  parse-build/narrate with a keyless stub (`_shared/mock.ts`). compose-poster
  needs no AI. Switch back with `LLM_PROVIDER=gemini|openai` + the key.
- Note: `pipeline-segment`/`pipeline-extract` guard the server with
  `import.meta.main`; `parse-build`/`narrate` now do too, so their handlers are
  importable/testable without binding a port.
