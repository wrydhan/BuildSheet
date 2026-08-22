# BuildSheet

A digital garage for car enthusiasts. Log mods and maintenance, turn your build into a swipeable magazine of spec sheets, and share it with a public link.

Built with **Expo** (iOS, Android, web) and **Supabase** (auth, database, edge functions).

## What it does

- **Garage** — add your car and log build entries (mods, service, notes)
- **Magazine** — browse poster-style spec sheets page by page (swipe or tap through)
- **Sheets** — generate styled pages from your build data and photos
- **Share** — publish a public garage page at `/c/<slug>` for anyone to view
- **Auth** — email/password accounts; one car per account in v1

AI features (parse freeform text, generate narration) run server-side via Supabase Edge Functions. With `DEMO_MODE` enabled in the app, the UI works without API keys using built-in demo content.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10 (`npm install -g pnpm` or `corepack enable`)

Optional (for full backend development):

- [Supabase CLI](https://supabase.com/docs/guides/cli) — local database and functions
- [Deno](https://deno.land/) — edge function tests

## Quick start (web)

```bash
git clone https://github.com/wrydhan/BuildSheet.git
cd BuildSheet
pnpm install
```

Create `apps/mobile/.env` (copy from `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_WEB_URL=http://localhost:8081
```

Then start the app in the browser:

```bash
pnpm mobile:web
```

Open [http://localhost:8081](http://localhost:8081).

> The Supabase URL and anon key are safe to share with collaborators — they are public client keys. Row Level Security protects user data. Never commit service-role keys or LLM API keys.

## Development commands

```bash
pnpm dev              # Start Expo dev server
pnpm mobile:web       # Run in the browser
pnpm mobile:ios       # Run on iOS simulator
pnpm mobile:android   # Run on Android emulator

pnpm lint             # Lint the mobile app
pnpm typecheck        # TypeScript check
pnpm test             # Deno tests for Supabase edge functions
```

### Local Supabase (optional)

If you want to run the database and edge functions locally instead of using a hosted Supabase project:

```bash
pnpm sb:start         # Start local Supabase
pnpm sb:reset         # Reset local database (applies migrations)
pnpm sb:serve         # Serve edge functions locally
```

Edge function secrets (for AI features) go in `supabase/functions/.env` (gitignored). Set `LLM_PROVIDER=mock` there to test the full flow without an API key.

## Project structure

```
apps/mobile/          Expo React Native app (Expo Router in src/app/)
supabase/
  migrations/         Postgres schema, RLS, seed data
  functions/          Edge functions (parse, narrate, compose-poster, …)
.env.example          Template for apps/mobile/.env
BUILD_PROGRESS.md     Feature checklist and implementation notes
```

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (logged out) |
| `/signup`, `/login` | Account creation and sign-in |
| `/(app)` | Garage (protected) |
| `/(app)/magazine` | Swipeable magazine viewer |
| `/(app)/build` | Add build entries |
| `/c/[slug]` | Public share page (no account required) |

## Sharing with others for feedback

**Run locally:** share the repo link plus your `apps/mobile/.env` Supabase values. They run `pnpm install && pnpm mobile:web` on their machine.

**No install:** requires deploying the web build (not set up yet). Public garage links at `/c/<slug>` work once the app is hosted and `EXPO_PUBLIC_WEB_URL` matches that domain.

## Status

Feature-complete MVP. Remaining work is mostly runtime bring-up: apply migrations to your Supabase project, configure edge function secrets, and deploy web/native builds. See `BUILD_PROGRESS.md` for details.
