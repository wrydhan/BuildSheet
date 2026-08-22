# BuildSheet Mobile

Expo app for BuildSheet. See the [root README](../../README.md) for full setup.

## Quick start

From the repo root:

```bash
pnpm install
pnpm mobile:web
```

From this directory:

```bash
pnpm start    # Expo dev server
pnpm web      # Browser
pnpm ios      # iOS simulator
pnpm android  # Android emulator
```

App source lives in `src/app/` (Expo Router file-based routing).

## Environment

Create `.env` in this directory (see `.env.example` at the repo root):

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_WEB_URL=http://localhost:8081
```

`EXPO_PUBLIC_WEB_URL` is used to build public share links (`/c/<slug>`). Use your deployed domain in production.
