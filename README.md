# TurboKeys

A typing speed test: timed tests, live WPM and accuracy, a personal history, and a public leaderboard.

**Stack:** Next.js (App Router) on Vercel, Supabase (Postgres + Auth), TypeScript, Tailwind CSS. There is no separate backend server:
the API is Next.js route handlers (`src/app/api`) that talk to Supabase.

## How it fits together

```
Browser (React pages)
   │  fetch /api/...                      sign in / sign up / Google / GitHub
   ▼                                              ▼
Next.js route handlers  ───────────────►  Supabase Auth (session in cookies)
   │  Supabase client acting as the signed-in user
   ▼
Supabase Postgres  (row-level security on every table)
```

- **Auth** is Supabase Auth: email + password, Google and GitHub. The session lives in cookies, so pages and API routes see the same user.
  `src/proxy.ts` refreshes it on every request.
- **Data** lives in two tables, `profiles` and `typing_tests` (`supabase/migrations`). Row-level security means a user can only read,
  add or delete their own tests; stats, role and ids cannot be edited from the browser.
- **Leaderboard, stats and account deletion** are database functions (`leaderboard`, `my_typing_stats`, `delete_my_account`), so the
  app never needs a service-role key. Only the public URL and publishable key are used.
- **Test submissions** are checked on the server (`src/lib/typing/submission.ts`): known fields only, valid ranges, and a WPM the
  typed characters could actually produce.

## Run it

```bash
npm install
cp .env.example .env.local     # then paste the publishable key from Supabase > Settings > API
npm run dev                    # http://localhost:3000
```

```bash
npm test          # database rules (real Postgres via PGlite), API routes, validation
npm run typecheck
npm run build
```

## Set up the Supabase project (once)

1. **Database:** apply `supabase/migrations/20261104000000_turbokeys_schema.sql` (SQL editor, or `supabase db push` after
   `supabase link --project-ref tqiqcjilhcaocebeeyac`).
2. **Authentication > URL Configuration:** set *Site URL* to the production address, and add these *Redirect URLs*:
   `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.
3. **Authentication > Providers:** enable *Email*, *Google* and *GitHub*. In the Google and GitHub developer consoles set the
   callback URL to `https://tqiqcjilhcaocebeeyac.supabase.co/auth/v1/callback`, then paste each client id and secret into Supabase.
4. **Email confirmation:** with *Confirm email* on (the default), new sign-ups see "Check your email" and sign in after clicking the
   link. Turn it off in *Authentication > Providers > Email* if you want instant sign-in.

## Deploy (Vercel)

Framework preset **Next.js**, root directory = the repository root. Environment variables (all environments):
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Project layout

```
src/app/            pages and API routes (App Router)
src/app/api/        typing-tests, users, auth route handlers
src/app/auth/       OAuth callback (code -> session)
src/views/          the page components (Home, Login, Leaderboard, ...)
src/lib/supabase/   browser, server and proxy Supabase clients
src/lib/api/        route helpers and row mappers
src/lib/typing/     test submission validation
src/db/             PGlite test harness for the migrations
supabase/migrations the schema
```
