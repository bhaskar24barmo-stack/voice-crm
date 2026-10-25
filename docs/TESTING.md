# Testing checklist (v2.0)

Run first: `npm install && npm run typecheck && npm run lint && npm run build`

## Auth and routing
- Logged out: `/account`, `/account/contacts` redirect to `/login`. `/api/crm/contacts` returns 401.
- Log in (password, Google, magic link) → lands on `/account`. Log out → back to the landing page; `/account` redirects again.
- Session renewal: stay signed in for more than an hour (or set Supabase JWT expiry to 10 minutes temporarily) and keep clicking around; you should not be logged out.

## Data and isolation
- Run `supabase/crm-schema.sql`, then `supabase/rls-test.sql` with two real user ids: every `should_be_0_*` result must be 0.
- Create two accounts. In account A add a contact, lead, task, call. In account B confirm none appear, and that opening A's `/account/contacts/<id>` shows "Not found".
- Create, edit, search, delete a contact. Create a task linked to it; complete it; check Overdue and Upcoming tabs.
- Move a lead across all six stages with the stage selector.
- Settings → Export my data downloads JSON with only your records.

## AI
- With no `OPENROUTER_*` set: assistant shows the "not configured" notice and Run is disabled.
- Wrong key → "provider rejected the API key". Wrong model id → "model isn't available". Run >30 times in 10 minutes → rate-limit message.
- Each task returns text; "Extract action items" returns a summary plus items.

## Voice (Home screen)
- No `STT_*` set: tapping the orb explains it; typing a note in the box below still saves it.
- With STT and OpenRouter set: tap the orb, say "aaj Rahul se call hui, kal ka petrol kharcha 800 tha, kal client aayega", tap again. You should get a note, an expense note and a task due tomorrow. Check Tasks and Recent activity.
- Tap Undo: the new items disappear.
- Deny microphone permission: friendly message appears.

## Phone feel (test on a real phone)
- Dock: four tabs (Home, Contacts, Pipeline, Tasks). The voice orb is on Home.
- Tasks: swipe a task right to complete it (green check, buzz, confetti). The checkbox also works.
- Forms open as bottom sheets; drag the grey handle down to close.
- Pull down at the top of a page: the logo appears and the data refreshes.
- Scroll down: the top bar hides; scroll up: it returns.
- "Add to home screen" card appears on Home (Android: Install button; iPhone: Share, then Add to Home Screen).

## Responsive and accessibility
- 375 px wide: sidebar becomes a drawer, tables become cards, pipeline scrolls sideways.
- Keyboard only: tab through nav, open a dialog (focus stays inside), Escape closes it, focus returns to the button.
