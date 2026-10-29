# Deploy to Vercel

Vercel is the recommended platform for Next.js applications (made by the Next.js team).

## Prerequisites

- GitHub account with your code pushed
- Vercel account (free tier available)
- Your environment variables ready

## Deployment Steps

### 1. Sign Up / Log In to Vercel

Go to [vercel.com](https://vercel.com) and sign up or log in with your GitHub account.

### 2. Import Your GitHub Repository

1. Click **"Add New Project"**
2. Select **"Import Git Repository"**
3. Choose your repository: `eddardthehouesofstark-stack/deeps-14`
4. Click **"Import"**

### 3. Configure Your Project

Vercel will auto-detect Next.js settings. You can keep the defaults:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

### 4. Add Environment Variables

Click **"Environment Variables"** and add these (one by one):

#### Required Variables:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

NEXT_PUBLIC_SUPABASE_URL=https://arnlbemuikqigpgrkjzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
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

Click **"Deploy"** and wait for the build to complete (usually 1-2 minutes).

### 6. Get Your URL

Once deployed, Vercel will give you a URL like:
```
https://deeps-14-xyz.vercel.app
```

### 7. Update NEXT_PUBLIC_SITE_URL

1. Go back to **Settings → Environment Variables**
2. Update `NEXT_PUBLIC_SITE_URL` with your actual Vercel URL
3. Redeploy (Vercel → Deployments → three dots → Redeploy)

### 8. Set Up Telegram Webhook (if using Telegram)

After deployment, set your webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook?secret=<YOUR_WEBHOOK_SECRET>"}'
```

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to any branch** → Preview deployment

## Custom Domain (Optional)

1. Go to your project in Vercel
2. Click **Settings → Domains**
3. Add your custom domain
4. Update DNS records as instructed

## Monitoring

- **View Logs**: Vercel Dashboard → Your Project → Logs
- **Check Analytics**: Vercel Dashboard → Analytics
- **View Deployments**: Vercel Dashboard → Deployments

## Troubleshooting

### Build Fails

Check the build logs in Vercel Dashboard. Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

### App Runs Locally But Not on Vercel

- Verify all environment variables are set
- Check that API routes are working
- Review function logs in Vercel

### Supabase Connection Issues

- Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase dashboard for connection errors

## Vercel CLI (Optional)

For deployment from command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Cost

- **Free tier**: Includes:
  - 100GB bandwidth
  - Unlimited deployments
  - Custom domains
  - Automatic HTTPS

- **Pro tier**: $20/month
  - More bandwidth
  - Password protection
  - Team collaboration

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Support](https://vercel.com/support)
