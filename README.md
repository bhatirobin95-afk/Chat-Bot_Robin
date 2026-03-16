# ☀ Epax Solar — Chat Bot & Lead Dashboard

A self-hosted chatbot for epax-solar.de with a password-protected admin dashboard
for managing leads. No monthly SaaS fees — runs on your own server.

---

## What's included

| File | Purpose |
|------|---------|
| `server.js` | Express backend — chat API, lead storage, auth |
| `public/widget.js` | Embeddable floating chat widget (goes on your website) |
| `public/admin.html` | Password-protected leads dashboard |
| `public/index.html` | Demo/test page |
| `data/leads.json` | Lead storage (auto-created) |

---

## Quick start (local test)

```bash
cd epax-solar-bot
npm install
cp .env.example .env        # edit password + API key
npm start
```

Open http://localhost:3000 — the demo page with the widget.
Open http://localhost:3000/admin — the admin dashboard.

---

## Deploy to Railway (recommended — free tier, 5 min)

1. Go to https://railway.app and sign up (free)
2. Click "New Project" → "Deploy from GitHub repo"
   - Or: "Deploy from template" → Node.js
3. Upload these files or connect your GitHub repo
4. In Railway → Settings → Environment Variables, add:
   ```
   ADMIN_PASSWORD=IhrSicheresPasswort123
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxx   (optional but recommended)
   ```
5. Railway gives you a URL like: https://epax-bot-production.up.railway.app
6. That's your BOT_URL

---

## Deploy to Render (alternative free option)

1. Go to https://render.com → New → Web Service
2. Connect your repo or upload files
3. Set:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables (same as above)

---

## Embed on epax-solar.de

Paste this once before `</body>` on **every page** of your website:

```html
<!-- Epax Solar Chat Bot -->
<script>
  window.EPAX_BOT_URL = 'https://YOUR-SERVER-URL.railway.app';
</script>
<script src="https://YOUR-SERVER-URL.railway.app/widget.js" defer></script>
```

Replace `YOUR-SERVER-URL.railway.app` with your actual deployed URL.

For the Gambio shop (which Epax uses), this snippet goes in:
**Admin → Einstellungen → Template → HTML-Header/Footer → Before </body>**

---

## Admin Dashboard

URL: `https://your-server.com/admin`
Default password: `epax2024` ← **change this in .env before deploying!**

Features:
- View all leads with score (hot/warm/cold) and status
- Filter by score, status, or search by name/email/company
- Update lead status (Neu → Kontaktiert → Konvertiert)
- Click any lead for full detail + direct email link
- Export all leads to CSV (opens in Excel)
- Auto-refreshes every 30 seconds

---

## Enable AI responses (optional but recommended)

Without an API key, the bot uses smart keyword matching (works fine).
With an Anthropic API key, it uses Claude for fully intelligent answers.

1. Get a key at https://console.anthropic.com
2. Add to your .env: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the server

Cost: roughly €0.002–0.005 per conversation (very cheap).

---

## Security

- The `/admin` route and all `/api/admin/*` endpoints require a valid session token
- Tokens expire after 8 hours
- Sessions are stored server-side (not in a browser cookie that could be stolen)
- For extra security, add IP restriction in Railway/Render to only allow your office IP

---

## Changing the password

Edit `.env` and change `ADMIN_PASSWORD`, then restart the server.
All active sessions are invalidated on restart.
