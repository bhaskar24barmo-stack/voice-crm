# Voice CRM V2 (after-login app)

1. Supabase > SQL editor: run `supabase/migrations/001_voice_crm.sql` (tables + row-level security: each user sees only their own rows).
2. Copy `.env.example` values into `.env.local` and into Vercel. Redeploy.
3. Merge into your repo: `app/app`, `app/api/assistant`, `components/app`, `lib`, `supabase`, plus the two new dependencies in package.json (`@supabase/ssr`, `@supabase/supabase-js`). If your repo already has a Supabase browser client, return it from `lib/supabase.ts`.
4. `npm install && npm run typecheck && npm run build`, then sign in and open `/app`.

Not built yet: teams/organisations, billing, calendar and email sync, delete/edit screens, tests, a hard rate limit (Redis), PWA/offline.
