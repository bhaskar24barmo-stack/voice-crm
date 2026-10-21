# Voice CRM v1: Launch Guide

Two parts: **A) what goes in the environment**, then **B) what to do after, in order.**

---
## A) Environment variables

Local: put them in `.env.local` (copy from `.env.example`).
Live: Vercel -> your project -> Settings -> Environment Variables -> add each for **Production** (and Preview if you want), then **Redeploy**.

| Name | Needed for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | sitemap, canonical links, and the sign-in link emails (required for them) | your live URL, e.g. `https://voice-crm-landing.vercel.app` |
| `SUPABASE_URL` | waitlist, login | Supabase -> Project Settings -> API -> Project URL |
| `NEXT_PUBLIC_SUPABASE_URL` | login | same Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | login / signup | same page -> `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | waitlist saving | same page -> `service_role` key. **Secret. Never commit it, never add `NEXT_PUBLIC_` to it.** |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console | the `content="..."` value of the HTML tag Google gives you |
| `WAITLIST_WEBHOOK_URL` | optional | only if you use a Google Sheet/webhook instead of Supabase |

The site also accepts the names Vercel's Supabase integration creates: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (instead of the anon key) and `SUPABASE_SECRET_KEY` (instead of the service role key). You only need one name per row.

Rules of thumb:
- Variables starting with `NEXT_PUBLIC_` are visible to anyone in the browser. Only put public things there.
- Changing a variable on Vercel does nothing until you redeploy.
- Missing variables don't break the site. The waitlist and login just show a "not connected yet" message.

---
## B) After this: do these in order

**1. Run it locally (10 min)**
`npm install`, then `npm run dev`, open http://localhost:3000. Click through every section, the demo video (try the sound button), /blog, /login.

**2. Push to GitHub (5 min)**
Create an empty repo, then run the commands in `README.md`. Add teammates under Settings -> Collaborators. Check that `.env.local` is NOT in the repo.

**3. Set up Supabase (15 min)**
- Create a project. In the SQL editor run `supabase/schema.sql`.
- Authentication -> URL Configuration: set Site URL to your live domain.
- **Google sign-in:** Google Cloud Console -> APIs & Services -> OAuth consent screen (app name + your support email), then Credentials -> Create OAuth client ID -> Web application. Under Authorized redirect URIs add `https://<your-project-ref>.supabase.co/auth/v1/callback`. Copy the Client ID and Secret.
- Supabase -> Authentication -> Providers -> Google: turn on, paste the Client ID and Secret.
- Supabase -> Authentication -> URL Configuration -> Redirect URLs: add `https://your-domain/auth/callback` (and `http://localhost:3000/auth/callback` for local testing).
- Keep "Confirm email" on. Note: Supabase's built-in email sender is rate-limited, so for real launch traffic add your own SMTP (Resend, Brevo, etc.) under Authentication -> SMTP.

**4. Add the variables on Vercel and redeploy (5 min)** (table above).

**5. Test on the live site (10 min)**
- Join the waitlist with a real email, then check Supabase -> Table Editor -> `waitlist`.
- Join with the same email again. It should still say success, with no duplicate row.
- Click "Continue with Google" on /login, and also try "Email me a link". Both should land on /account.
- Sign up with email + password, click the confirmation email, log in, log out.
- Note: sessions last about an hour for now (refresh tokens are a v1.1 item).
- Open the site on a real phone: menu, forms, demo video, blog.

**6. Google Search Console (10 min)**
- Add property -> URL prefix -> HTML tag. Put the token in `NEXT_PUBLIC_GSC_VERIFICATION`, redeploy, click Verify.
- Sitemaps -> submit `https://your-domain/sitemap.xml`.
- Indexing takes days to weeks. That is normal.

**7. Content plan (ongoing)**
- 4 posts exist. Add 2-3 a week from `content/TOPICS.md`: copy a file in `content/blog/`, change the header and body, commit, and Vercel redeploys automatically.
- Quality beats count: 20 genuinely useful posts beat 100 thin ones.
- Every post should answer one real question and end with the waitlist link.

**8. Before sharing widely**
- Add a Privacy Policy page (you collect names and emails; have it reviewed for your region).
- Buy and connect a custom domain in Vercel -> Settings -> Domains, then update `NEXT_PUBLIC_SITE_URL`.
- Optional: record a real product demo and use `<VideoDemo src="/demo.mp4" />` once the product exists. The current video is an animation and is labelled as one.

**9. Ideas for v1.1**
Email confirmation to waitlist joiners, a simple admin view of signups, an About page, OG share image, analytics (Plausible or Vercel Analytics).
