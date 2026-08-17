# CarStory

A digital garage: log car mods and maintenance as magazine-style posters, shared via a public link.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) 10 (enabled via Corepack: `corepack enable`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) for local backend
- [Deno](https://deno.land/) for edge function tests

## Setup

```bash
pnpm install
```

Copy env files as needed:

- `apps/mobile/.env` — Expo public Supabase URL and anon key
- `supabase/functions/.env` — secrets for local function serving

## Development

```bash
pnpm dev              # Start Expo (mobile app)
pnpm mobile:ios       # Run on iOS simulator
pnpm mobile:android   # Run on Android emulator
pnpm mobile:web       # Run in the browser

pnpm sb:start         # Start local Supabase
pnpm sb:serve         # Serve edge functions locally
pnpm sb:reset         # Reset local database
```

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test             # Deno tests for Supabase functions
```

## Project structure

```
apps/mobile/     Expo React Native app
supabase/        Migrations, edge functions, local config
```
