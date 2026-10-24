# Put v2 on GitHub (on top of your existing repo)

Safest route: push v2 on a new branch, check the Vercel preview, then merge. Your current site keeps working until you merge.

## 1. Get your repo and the v2 folder side by side
```bash
# unzip voice-crm-v2.0.0.zip into a folder, e.g. ~/voice-crm-v2
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
git checkout -b v2-crm
```
(If you already have the repo on your computer, `cd` into it, run `git pull`, then `git checkout -b v2-crm`.)

## 2. Copy v2 over the old files (keeps your .git history)
Mac / Linux:
```bash
rsync -av --exclude .git --exclude node_modules --exclude .next --exclude '.env*' ../voice-crm-v2/ ./
```
Windows (PowerShell):
```powershell
robocopy ..\voice-crm-v2 . /E /XD .git node_modules .next
```

## 3. Check it builds, then commit
```bash
npm install
npm run typecheck && npm run lint && npm run build
git status          # make sure no .env files are listed
git add -A
git commit -m "Voice CRM v2"
git push -u origin v2-crm
```

## 4. Review and merge
1. On GitHub, click **Compare & pull request** for `v2-crm`, then **Create pull request**.
2. Vercel posts a **Preview** link on the pull request. Open it and run through `docs/TESTING.md`.
3. Before the preview can use the CRM, set the Vercel environment variables listed in README.md and run `supabase/crm-schema.sql` in Supabase.
4. When happy: **Merge pull request**. Vercel deploys it to your main site.

Something broke after merging? On the pull request page click **Revert**, or redeploy the previous deployment in Vercel.

## Never commit secrets
`.env`, `.env.local` and API keys must stay out of GitHub. They belong only in Vercel → Settings → Environment Variables. If a key was ever pushed, rotate it.
