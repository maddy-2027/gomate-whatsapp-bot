# 🚀 GoMate Deployment Guide for Koyeb (100% Free)

Koyeb is a drop-in replacement for Render that runs persistent Docker containers with **no credit card required** to get started.

---

## Step 1: Sign up on Koyeb (1 minute)
1. Go to **[koyeb.com](https://app.koyeb.com/auth/signup)**
2. Click **"Sign up with GitHub"** (authorize with your GitHub account)

---

## Step 2: Create a New App
1. In the Koyeb Control Panel, click **"Create Service"** (or **"Create App"**).
2. Choose **GitHub** as the deployment method.
3. Select your repository: **`maddy-2027/gomate-whatsapp-bot`**.
4. Branch: **`main`**.

---

## Step 3: Configure Settings
Koyeb will automatically detect the **`Dockerfile`**:

| Setting | Value |
|---|---|
| **Builder** | **Dockerfile** (Auto-detected) |
| **Region** | **Singapore (`sin`)** *(Lowest latency for Maharashtra, India)* |
| **Instance Type** | **Eco Nano** *(Free Tier)* |
| **Exposed Port** | **`3000`** with Protocol **`HTTP`** and Path **`/`** |

---

## Step 4: Add Environment Variables
In the **"Environment variables"** section, click **"Add variable"** and add these:

```env
NODE_ENV=production
PORT=3000
NODE_TLS_REJECT_UNAUTHORIZED=0
ADMIN_PASSWORD=gomate2026
ADMIN_SESSION_SECRET=gomate_secure_admin_session_secret_2026_jath_sangli_secret_key
OWNER_SESSION_SECRET=gomate_owner_portal_jwt_secret_2026_jath_auth_token_key

# Supabase (Database & Session Persistence)
SUPABASE_URL=https://ibtznblylmqyexfkyjrv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay (Live Payments & Webhooks)
RAZORPAY_KEY_ID=your_razorpay_live_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Gemini AI (Smart Chat & Recommendations)
GEMINI_API_KEY=your_gemini_api_key
```

---

## Step 5: Click "Deploy"
1. Click **"Deploy"**.
2. Koyeb will build the Docker container and start your GoMate bot in ~90 seconds.
3. You will get an HTTPS URL like:  
   `https://gomate-whatsapp-bot-xxxx.koyeb.app`

---

## Step 6: Link WhatsApp & Razorpay Webhooks
1. **WhatsApp QR Code**:  
   Open `https://your-app-name.koyeb.app/qr` in your phone browser and link your WhatsApp!  
   *(Once linked, the session is saved to Supabase so it auto-reconnects forever).*
2. **Owner Login Portal**:  
   Access your owner portal at `https://your-app-name.koyeb.app/owner/login`
3. **Razorpay Webhook**:  
   In [Razorpay Dashboard → Settings → Webhooks](https://dashboard.razorpay.com/app/webhooks), set the webhook URL to:  
   `https://your-app-name.koyeb.app/webhook/razorpay`  
   Events: `payment_link.paid`, `payment.captured`
