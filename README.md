# AI-RankChecker

RankCheck Pro — Next.js app + Google Apps Script (`apps-script/`) for SERP rank checks via Serper. **Repo root = Next.js project** (no `web/` subfolder).

## Run locally

```bash
npm install
npm run dev
```

## Deploy (Vercel)

1. Import this GitHub repo.
2. **Root Directory** = `.` (leave empty / repository root) — `package.json` with `next` is at root.
3. Framework: **Next.js** (auto).
4. After deploy, paste your Apps Script **Web app** URL (`.../exec`) in the app.

Apps Script must allow **Anyone** so the browser can `POST` from your Vercel domain.
