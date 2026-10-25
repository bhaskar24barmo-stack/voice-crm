# Changelog

## v2.0.0 — Voice CRM workspace (built on V1, no V2 template code)
**Workspace**
- `/account` is a full CRM: Home, Contacts, Pipeline, Tasks, Settings (activities, calls and AI tools are reached from Home and from each contact)
- One-button voice: tap the orb or the mic in the phone dock and speak in English, Hindi or Hinglish. Notes, tasks, meetings, expenses and new contacts are saved straight to the CRM, with Undo
- Optional AI assistant on OpenRouter, rate limited, sends the minimum data (never email or phone)
- Supabase tables with Row Level Security on every table; isolation test included
- Sessions renew automatically; security headers, same-origin checks, request limits, data export

**Design**
- New animated logo (orange C around a sound wave) and installable phone app with icons and a share preview
- Animated aurora background, glass cards with spotlight hover, glowing hero, counting numbers, skeleton loaders
- Phone-first: floating dock, bottom sheets you can swipe down, swipe a task right to complete it, pull down to refresh, haptic buzzes, confetti on success, header that hides while scrolling
- Waitlist removed: the landing page now sends visitors to create an account (your old waitlist table is left untouched)
- Fast on phones: effects run on the graphics chip instead of repainting, fewer database calls on Home, lists open instantly when you go back, thin progress bar and skeleton screens while pages load
- Landing design, login and signup unchanged

## v1.0.0
- Landing page with 3D hero, animated pipeline board, voice-command marquee, pointer spotlight, aurora background
- Interactive "type or speak" demo and a 16-second animated walkthrough with optional sound effects
- Stacked "How it works" cards and a dark 3D product tour
- Login redesign: split-screen layout, Continue with Google, email sign-in link, password show/hide, clearer errors
- Working waitlist API (Supabase or webhook), login / signup / account pages
- Blog (Markdown), sitemap, robots, structured data, Search Console verification hook
- Mobile menu, reduced-motion support, GitHub-ready repo files
