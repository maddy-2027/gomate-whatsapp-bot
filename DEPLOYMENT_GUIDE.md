# GoMate — Production Cloud Deployment Guide

This guide covers deploying GoMate to **Render.com** (recommended, free tier) or **Railway.app**, connecting your live WhatsApp SIM via Baileys QR pairing, and verifying all endpoints.

---

## 1. Prerequisites Checklist

Before deploying, confirm you have:

- [x] GitHub repository pushed at `https://github.com/maddy-2027/gomate-whatsapp-bot`
- [x] Supabase project with credentials (already in `.env`)
- [x] Google Gemini API key (already in `.env`)
- [ ] Razorpay live API keys (currently using `dummy_key_id` — replace before taking payments)
- [ ] A real WhatsApp SIM/phone number to pair via QR after deployment

---

## 2. Deploy to Render.com (Recommended — Free Tier)

### Step 1 — Connect Repository
1. Open [dashboard.render.com](https://dashboard.render.com/) and sign in.
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account and select the `gomate-whatsapp-bot` repository.
4. Render auto-detects `render.yaml` — click **Apply**.

### Step 2 — Set Secret Environment Variables
The following variables are marked `sync: false` in `render.yaml` (they need manual entry in the Render dashboard under **Environment**):

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `SUPABASE_URL` | `https://ibtznblylmqyexfkyjrv.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `RAZORPAY_KEY_ID` | Your Razorpay live key |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `TWILIO_ACCOUNT_SID` | Your Twilio SID (optional, Baileys is primary) |
| `TWILIO_AUTH_TOKEN` | Your Twilio auth token (optional) |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+17372508034` (optional) |

### Step 3 — Deploy & Wait
- Click **Save Changes** → Render starts the build.
- Build time: ~2–4 minutes (installs `node_modules`, skips Chromium).
- Once live, your URL will be: `https://gomate-whatsapp-bot.onrender.com`

### Step 4 — Link Your WhatsApp SIM
1. Open `https://gomate-whatsapp-bot.onrender.com/qr` in your browser.
2. Scan the QR code using WhatsApp on your phone (Settings → Linked Devices → Link a Device).
3. Once paired, the bot goes fully live. The Baileys auth session is persisted on the 1 GB Render Disk so **it survives service restarts and new deploys**.

---

## 3. Deploy to Railway.app (Alternative)

1. Create account at [railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub Repo** → select `gomate-whatsapp-bot`.
3. Railway auto-detects `railway.json` and `Dockerfile`.
4. Go to **Variables** tab and add all env vars from Section 2 above.
5. Go to **Settings → Networking** → **Generate Domain** to get a public URL.
6. Open `https://<your-domain>.railway.app/qr` and scan the WhatsApp QR.

> **Note:** Railway does not have persistent disk on free tier. Baileys auth will reset after restarts. Upgrade to a paid plan or use Railway Volumes.

---

## 4. Webhook Configuration (Optional — Twilio Fallback)

If you want Twilio as a fallback channel alongside Baileys:

1. Open [Twilio Console → Messaging → WhatsApp Sandbox Settings](https://console.twilio.com).
2. Set **When a message comes in** to:
   ```
   https://gomate-whatsapp-bot.onrender.com/webhook/whatsapp
   ```
3. Method: **HTTP POST** → Save.

---

## 5. Razorpay Webhook

1. Open [Razorpay Dashboard → Settings → Webhooks](https://dashboard.razorpay.com).
2. Add New Webhook URL:
   ```
   https://gomate-whatsapp-bot.onrender.com/webhook/razorpay
   ```
3. Enable Events: `payment.captured`, `subscription.activated`, `subscription.charged`, `payment_link.paid`
4. Click **Create Webhook**.

---

## 6. Verify All Endpoints Are Live

Once deployed, test each endpoint:

| URL | Expected | Purpose |
|---|---|---|
| `GET /api/health` | `200 OK` | Container health & uptime |
| `GET /` | `200 OK` | WhatsApp Web Simulator |
| `GET /qr` | `200 OK` | WhatsApp Pairing Dashboard |
| `GET /landing` | `200 OK` | Public GoMate Marketing Page |
| `GET /owner` | `200 OK` | Owner Pro Portal |
| `GET /admin` | `200 OK` + Auth | Operations HQ |
| `POST /webhook/whatsapp` | `200 OK` | Live message webhook |

Run this quick health-check from your terminal:

```powershell
curl https://gomate-whatsapp-bot.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "GoMate WhatsApp Bot & Operations HQ",
  "uptime": 42,
  "whatsapp": "qr_ready"
}
```

---

## 7. Local Docker Test (Before Pushing)

```powershell
# Build image
docker build -t gomate-whatsapp-bot .

# Run with environment file
docker run -p 3000:3000 --env-file .env gomate-whatsapp-bot
```

---

## 8. Keep-Alive Anti-Sleep (Auto-configured)

The `initKeepAlive()` service in `src/services/keepAlive.js` automatically pings  
`https://gomate-whatsapp-bot.onrender.com/api/health` every 8 minutes to keep the  
Render free-tier container warm and prevent cold-start delays for farmers.
