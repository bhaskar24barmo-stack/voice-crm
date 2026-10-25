# Voice CRM landing

Next.js 14 + Tailwind. Landing page, login/signup, the Voice CRM workspace, and a blog.

> Full launch steps and environment variables: see **LAUNCH-GUIDE.md**.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev
```

## Put it on GitHub (so everyone can work on it)
```bash
git init && git add . && git commit -m "Voice CRM landing"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/voice-crm-landing.git
git branch -M main && git push -u origin main
```
`.env*` files are git-ignored. Never commit keys.

## Make login/signup work (Supabase, free tier)
1. Create a project at supabase.com. Run `supabase/schema.sql` in the SQL editor.
2. Copy the values from Project Settings -> API into `.env.local` (and into Vercel -> Settings -> Environment Variables).
3. Authentication -> Providers -> Email: keep "Confirm email" on, and set the Site URL to your domain.
4. Redeploy. Accounts appear under Authentication -> Users. (The old `waitlist` table is left untouched in case it holds sign-ups you want to keep.)


## Blog and SEO
- Posts are Markdown files in `content/blog/` (copy an existing one; keep the `---` header).
- `/sitemap.xml` and `/robots.txt` are generated automatically; each post has canonical URL and JSON-LD.
- Search Console: add your site, choose the "HTML tag" method, paste the `content` value into `NEXT_PUBLIC_GSC_VERIFICATION`, redeploy, click Verify, then submit `https://your-domain/sitemap.xml`.
- `content/TOPICS.md` is a backlog of post ideas.


## CRM workspace (V2)

After login, `/account` is the CRM. Landing page, login and signup are unchanged.

### 1. Database (required)
In Supabase, open **SQL Editor**, paste `supabase/crm-schema.sql` and run it. It only adds tables (contacts, leads, tasks, activities, calls, ai_usage) and never touches `waitlist`. Every table has Row Level Security so each user sees only their own rows.
Then run `supabase/rls-test.sql` (see the instructions at the top of that file) to confirm one user cannot read or change another user's data.

### 2. Environment variables (Vercel: Project → Settings → Environment Variables)
| Variable | Needed for |
|---|---|
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Login and all CRM data (already set if login works) |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | AI assistant and call summaries |
| `STT_API_URL`, `STT_API_KEY`, `STT_MODEL` | The voice button on Home (speech to text). Without them you can still type notes |
| `NEXT_PUBLIC_CURRENCY` | Currency for lead values (optional, default USD) |

Redeploy after changing variables. Settings → Integrations shows what is configured. Without the AI or transcription variables, those features say so and everything else still works.

### 3. Supabase auth settings
Keep your site URL and redirect URLs as they are. Sessions renew from a refresh token; if you changed JWT expiry in Supabase, anything of 10 minutes or more works.

### Notes
- Audio limit is 4 MB per clip (Vercel request limit), about 20 minutes of recording. Audio is forwarded to your transcription provider and is not stored.
- Contacts' emails and phone numbers are never sent to the AI. See the note under each assistant task for exactly what is sent.
- AI and transcription calls are limited per user (30 AI / 15 transcriptions per 10 minutes). Old `ai_usage` rows can be cleaned with the optional pg_cron line in the schema file.
- Deleting a contact deletes their activities and calls; their leads and tasks are kept and unlinked.
- Not included: team/shared workspaces, email sending, deleting your account (needs a service-role admin call), live call transcription.

### Testing checklist
See `docs/TESTING.md`.

### Voice button (v2.1)
Tap the orb on Home and speak. The audio is transcribed (`STT_*`), the text is sorted by the AI (`OPENROUTER_*`) into notes, tasks, meetings, expenses and contacts, and everything is saved at once. "Undo" removes what was just saved. If the AI is not configured, the text is saved as a single note. Expenses are stored as notes that start with "Expense". Names are matched to existing contacts only when exactly one matches.
