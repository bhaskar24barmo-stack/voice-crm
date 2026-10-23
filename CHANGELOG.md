# Changelog

## v2.0.0 — CRM workspace (built on V1, no V2 code)
- `/account` is now a CRM dashboard with sidebar navigation (mobile drawer), real stats, pipeline overview, follow-ups, recent activity and call summaries
- Contacts (search, filters, detail page with interaction history), leads with a six-stage pipeline, tasks with overdue/upcoming views, activities and calls
- AI assistant on OpenRouter: summaries, action items, follow-up emails, next steps, workflow help. Server-side only, rate limited, minimal data sent
- Voice page: record or upload audio with explicit consent, transcription through any OpenAI-compatible provider, AI summary, reviewed follow-up tasks, save to a contact
- Supabase schema with Row Level Security on every table (`supabase/crm-schema.sql`), isolation test (`supabase/rls-test.sql`)
- Sessions now renew automatically (refresh token + `middleware.ts`) instead of ending after about an hour
- Security headers, same-origin checks on writes, request size limits, data export
- Landing page, login, signup and waitlist unchanged

## v1.0.0
- Landing page with 3D hero, animated pipeline board, voice-command marquee, pointer spotlight, aurora background
- Interactive "type or speak" demo and a 16-second animated walkthrough with optional sound effects
- Stacked "How it works" cards and a dark 3D product tour
- Login redesign: split-screen layout, Continue with Google, email sign-in link, password show/hide, clearer errors
- Working waitlist API (Supabase or webhook), login / signup / account pages
- Blog (Markdown), sitemap, robots, structured data, Search Console verification hook
- Mobile menu, reduced-motion support, GitHub-ready repo files
