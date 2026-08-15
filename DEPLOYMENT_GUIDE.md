# GoMate — Production Cloud Deployment & Webhook Integration Guide

This guide details the step-by-step procedure to deploy the GoMate WhatsApp Bot and Operations HQ to production cloud infrastructure (Render, Railway, or VPS) and connect the live Twilio WhatsApp and Razorpay webhook endpoints.

---

## 1. Quick Deploy Options

### Option A: Deploy to Render.com (Recommended)
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render Dashboard](https://dashboard.render.com/) and click **New + $\rightarrow$ Blueprint**.
3. Connect your repository. Render will automatically detect [`render.yaml`](file:///C:/Users/udayp/.gemini/antigravity/scratch/gomate-whatsapp-bot/render.yaml) and use the Docker runtime.
4. Fill in your environment variables (see Section 2).
5. Click **Apply**. Render will build the container, install Chromium dependencies, and launch the service at `https://gomate-whatsapp-bot.onrender.com`.

### Option B: Deploy to Railway.app
1. Install Railway CLI or visit [Railway.app](https://railway.app/).
2. Create **New Project $\rightarrow$ Deploy from GitHub Repo**.
3. Railway automatically detects [`railway.json`](file:///C:/Users/udayp/.gemini/antigravity/scratch/gomate-whatsapp-bot/railway.json) and [`Dockerfile`](file:///C:/Users/udayp/.gemini/antigravity/scratch/gomate-whatsapp-bot/Dockerfile).
4. Add the environment variables under **Variables**.
5. Generate a Public Domain under **Settings $\rightarrow$ Networking**.

---

## 2. Production Environment Variables Checklist

Set these environment variables in your cloud provider's dashboard:

| Variable | Description | Example / Production Value |
|---|---|---|
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `ADMIN_PASSWORD` | Passkey for `/admin` HQ | `gomate2026` (or your strong secret) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_twilio_auth_token_here` |
| `TWILIO_WHATSAPP_NUMBER` | Twilio sender address | `whatsapp:+1XXXXXXXXXX` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AQ.Ab8RN6KjQekgs...` |
| `SUPABASE_URL` | Supabase project URL | `https://ibtznblylmqyexfkyjrv.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_ANON_KEY` | Supabase anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `RAZORPAY_KEY_ID` | Razorpay API Key | `rzp_live_XXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | `XXXXXXXXXXXXXXXXXXXXXXXX` |

---

## 3. Twilio WhatsApp Webhook Configuration

To receive messages sent by customers from their physical WhatsApp apps to your Twilio number:

1. Open the [Twilio Console $\rightarrow$ Messaging $\rightarrow$ Try WhatsApp](https://console.twilio.com/us1/develop/sms/try-sms/whatsapp-learn) (or **Senders $\rightarrow$ WhatsApp Senders** for production numbers).
2. Under **Sandbox Settings** (or **Endpoint Configuration**), locate **"WHEN A MESSAGE COMES IN"**.
3. Set the Webhook URL:
   ```
   https://<YOUR-CLOUD-DOMAIN>.onrender.com/webhook/whatsapp
   ```
4. Set HTTP Method to **`HTTP POST`**.
5. Click **Save**.

### Testing Twilio Webhook:
* Send a message from your personal phone (e.g. `join <your-sandbox-keyword>` or `Hi`).
* The GoMate bot will immediately respond with the Trilingual language selection menu!

---

## 4. Razorpay Webhook Configuration

To automatically activate owner subscriptions upon payment confirmation:

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) $\rightarrow$ **Settings $\rightarrow$ Webhooks**.
2. Click **Add New Webhook**.
3. Enter Webhook URL:
   ```
   https://<YOUR-CLOUD-DOMAIN>.onrender.com/webhook/razorpay
   ```
4. Select the following **Active Events**:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `payment.captured`
   - `payment_link.paid`
5. Click **Create Webhook**.

---

## 5. Health Check & Operations Verification

Once deployed, verify the system status:

| Endpoint | Expected Status | Purpose |
|---|---|---|
| `GET https://<domain>/api/health` | `200 OK` | Automated uptime & container health monitor |
| `GET https://<domain>/landing` | `200 OK` | Public marketing landing page |
| `GET https://<domain>/owner` | `200 OK` | Owner Pro Portal (Fleet manager & ₹599/mo plan) |
| `GET https://<domain>/admin` | `200 OK` | Operations HQ (Protected by password) |
| `POST https://<domain>/webhook/whatsapp` | `200 OK` | WhatsApp message ingestion endpoint |

---

## 6. Local Docker Test Command

You can build and run the production Docker image locally to test container parity:

```powershell
# Build image
docker build -t gomate-whatsapp-bot .

# Run container with environment file
docker run -p 3000:3000 --env-file .env gomate-whatsapp-bot
```
