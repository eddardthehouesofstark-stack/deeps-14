# Deploy to Render

Render is a great alternative to Vercel with generous free tier and excellent support for Node.js apps.

## Prerequisites

- GitHub account with your code pushed
- Render account (free tier available)
- Your environment variables ready

## Deployment Steps

### 1. Sign Up / Log In to Render

Go to [render.com](https://render.com) and sign up or log in with your GitHub account.

### 2. Create a New Web Service

1. Click **"New +"** in the top right
2. Select **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository: `eddardthehouesofstark-stack/deeps-14`
5. Click **"Connect"**

### 3. Configure Your Service

Fill in the following settings:

#### Basic Settings:

- **Name**: `deeps-ai-partner` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: Leave empty (or `./`)
- **Runtime**: `Node`

#### Build & Deploy Settings:

- **Build Command**:
  ```bash
  npm install && npm run build
  ```

- **Start Command**:
  ```bash
  npm start
  ```

#### Instance Type:

- **Free** tier (0.1 CPU, 512 MB RAM) - suitable for testing
- **Starter** ($7/month) - recommended for production

### 4. Add Environment Variables

Scroll down to **"Environment Variables"** and click **"Add Environment Variable"** for each:

#### Required Variables:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

NEXT_PUBLIC_SUPABASE_URL=https://arnlbemuikqigpgrkjzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_SITE_URL=https://your-app.onrender.com
NODE_ENV=production
```

#### Optional (for Telegram):

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
```

#### Optional (for Web Push):

```env
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:you@example.com
```

#### Optional (for Cron):

```env
CRON_SECRET=your_cron_secret
```

**Important**: Replace all placeholder values with your actual keys!

### 5. Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (usually 3-5 minutes)
3. Render will show you the deployment logs in real-time

### 6. Get Your URL

Once deployed, Render will give you a URL like:
```
https://deeps-ai-partner.onrender.com
```

### 7. Update NEXT_PUBLIC_SITE_URL

1. Go to **Environment** tab
2. Update `NEXT_PUBLIC_SITE_URL` with your actual Render URL
3. Save changes (this will trigger a redeploy)

### 8. Set Up Telegram Webhook (if using Telegram)

After deployment, set your webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.onrender.com/api/telegram/webhook?secret=<YOUR_WEBHOOK_SECRET>"}'
```

## Setting Up Cron Jobs (for Proactive Messaging)

Render has built-in cron job support:

### Option 1: Using Render Cron Jobs

1. Create a new **"Cron Job"** service in Render
2. Use the same repository
3. Set schedule (e.g., `*/30 * * * *` for every 30 minutes)
4. Set command:
   ```bash
   curl -X POST "https://your-app.onrender.com/api/cron/proactive?secret=<YOUR_CRON_SECRET>"
   ```

### Option 2: External Cron Service

Use [cron-job.org](https://cron-job.org) or similar:

1. Create account
2. Add job with URL:
   ```
   https://your-app.onrender.com/api/cron/proactive?secret=<YOUR_CRON_SECRET>
   ```
3. Set schedule (e.g., every 30 minutes)

## Automatic Deployments

Render automatically deploys when you push to GitHub:

- **Push to `main`** → Automatic deployment
- **Manual Deploy**: Click **"Manual Deploy"** → **"Deploy latest commit"**

## Custom Domain (Optional)

1. Go to **Settings** tab
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Follow DNS setup instructions

## Monitoring

### View Logs:
- Go to **Logs** tab in your service
- Real-time streaming logs
- Filter by date/time

### Metrics:
- Go to **Metrics** tab
- View CPU, memory, and bandwidth usage

### Events:
- Go to **Events** tab
- View deployment history and status

## Render Free Tier Limitations

⚠️ **Important**: Free tier services:
- **Spin down after 15 minutes** of inactivity
- **Take 30-60 seconds** to spin back up on first request
- **750 hours/month** of runtime (enough for one service)

**Recommendation**: For production, use **Starter plan ($7/month)** to avoid spin-down delays.

## Preventing Spin-Down (Free Tier Workaround)

If you must use free tier, set up a ping service:

### Option 1: UptimeRobot
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor: `https://your-app.onrender.com`
3. Set interval: Every 5 minutes

### Option 2: Render Cron Job
Create a cron job that pings your app every 10 minutes:
```bash
curl https://your-app.onrender.com
```

## Troubleshooting

### Build Fails

Check build logs in Render dashboard. Common issues:
- Missing dependencies in `package.json`
- Node version mismatch (specify in `package.json`)
- Environment variables not set

### Service Keeps Restarting

- Check logs for errors
- Verify start command is correct: `npm start`
- Ensure port binding is correct (Render provides `PORT` env var)

### Slow First Load (Free Tier)

This is expected behavior - service spins down after 15 minutes of inactivity. Upgrade to Starter plan or use ping service.

### Database Connection Issues

- Verify Supabase credentials
- Check that `NEXT_PUBLIC_SUPABASE_URL` is accessible
- Ensure IP whitelisting (if enabled in Supabase) includes Render IPs

## Render CLI (Optional)

For advanced users:

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

## Cost Comparison

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 750 hours/month, spins down after 15min |
| **Starter** | $7/month | Always on, 0.5 CPU, 512MB RAM |
| **Standard** | $25/month | 1 CPU, 2GB RAM, better performance |

## Upgrading from Free to Paid

1. Go to your service settings
2. Click **"Upgrade"**
3. Select plan
4. Add payment method

Your service will immediately stop spinning down.

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [Render Status Page](https://status.render.com)

## Next Steps After Deployment

1. ✅ Test all features (chat, Telegram, push notifications)
2. ✅ Set up monitoring (UptimeRobot or similar)
3. ✅ Configure custom domain (optional)
4. ✅ Set up SSL (automatic with Render)
5. ✅ Monitor logs for any errors
