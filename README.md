# AI-RankChecker

RankCheck Pro — Next.js UI (`web/`) + Google Apps Script (`web/apps-script/`) for SERP rank checks via Serper.

## Run locally

```bash
cd web
npm install
npm run dev
```

## Deploy (Vercel)

1. Import this GitHub repo in Vercel.
2. **Settings → General → Root Directory** = `web` (required — repo root has no `package.json`).
3. Framework: Next.js (auto). Build: `npm run build` inside `web`.
4. After deploy, open the `.vercel.app` URL and paste your Apps Script **Web app** URL (`.../exec`).

### Build log looks like this?

Lines such as *Running `next build`* and *Installing dependencies...* are normal. If the build **fails**, open the full log and check:

| Issue | Fix |
|--------|-----|
| `package.json` not found | Root Directory is not `web` — set it to `web` and redeploy. |
| Node / Next error | This project sets `engines.node` ≥ 20.9; Vercel defaults are fine. |
| Timeout on install | Retry deploy; rare npm registry blips. |

Apps Script Web App must allow **Anyone** so the browser can `POST` from your Vercel domain.
