# Deploy to Both Vercel AND Render

Deploying to both platforms gives you:
- ✅ **Redundancy**: If one goes down, you have a backup
- ✅ **Comparison**: Test performance and features side-by-side
- ✅ **Flexibility**: Use each for different purposes

## Strategy

- **Vercel** = Production (best performance for Next.js)
- **Render** = Staging/Backup (free tier for testing)

## Deployment Order

### Step 1: Deploy to Vercel First (Production)

Follow **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** completely.

Your Vercel URL will be something like:
```
https://deeps-14.vercel.app
```

**Key Environment Variables for Vercel:**
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
NEXT_PUBLIC_SUPABASE_URL=https://arnlbemuikqigpgrkjzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://deeps-14.vercel.app
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=your_cron_secret
```

### Step 2: Deploy to Render (Staging/Backup)

Follow **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)** completely.

Your Render URL will be something like:
```
https://deeps-ai-partner.onrender.com
```

**Key Environment Variables for Render:**
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
NEXT_PUBLIC_SUPABASE_URL=https://arnlbemuikqigpgrkjzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://deeps-ai-partner.onrender.com
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_staging
TELEGRAM_BOT_USERNAME=your_bot_username_staging
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_staging
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=your_cron_secret_staging
NODE_ENV=production
```

## Important: Different Telegram Bots

You have two options for Telegram:

### Option A: Same Bot, Different Webhook (Not Recommended)
⚠️ **Problem**: One bot can only have ONE webhook URL active at a time.

If you use the same bot for both platforms, only the LAST webhook you set will work.

### Option B: Two Different Bots (Recommended)
✅ **Solution**: Create two Telegram bots

**Production Bot (Vercel):**
1. Create bot with [@BotFather](https://t.me/BotFather): `/newbot`
2. Name it: `YourApp Bot` → username: `yourapp_bot`
3. Set webhook to Vercel URL

**Staging Bot (Render):**
1. Create another bot with [@BotFather](https://t.me/BotFather): `/newbot`
2. Name it: `YourApp Staging Bot` → username: `yourapp_staging_bot`
3. Set webhook to Render URL

## Setting Up Webhooks

### Vercel Telegram Webhook:
```bash
curl -X POST "https://api.telegram.org/bot<PRODUCTION_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://deeps-14.vercel.app/api/telegram/webhook?secret=<VERCEL_WEBHOOK_SECRET>"}'
```

### Render Telegram Webhook:
```bash
curl -X POST "https://api.telegram.org/bot<STAGING_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://deeps-ai-partner.onrender.com/api/telegram/webhook?secret=<RENDER_WEBHOOK_SECRET>"}'
```

## Shared Resources

Both deployments share:
- ✅ **Same Supabase database** (same data, memories, preferences)
- ✅ **Same Groq API key** (same AI backend)
- ✅ **Same GitHub repository** (both auto-deploy on push)

Separate resources:
- 🔀 **Different URLs** (obviously)
- 🔀 **Different Telegram bots** (recommended)
- 🔀 **Different webhook secrets** (for security)

## Managing Deployments

### When You Push to GitHub:
Both platforms will automatically deploy! 🚀

```bash
git add .
git commit -m "Update feature"
git push
```

This triggers:
1. ✅ Vercel deployment (production)
2. ✅ Render deployment (staging)

### Testing Flow:
1. **Test on Render** (staging) first
2. If everything works, **use Vercel** (production) for real users
3. Keep Render running as backup

## Monitoring Both Deployments

### Vercel:
- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Logs: Real-time in dashboard
- Analytics: Built-in analytics

### Render:
- Dashboard: [dashboard.render.com](https://dashboard.render.com)
- Logs: Real-time streaming logs
- Metrics: CPU/Memory/Bandwidth

## Cron Jobs (Proactive Messages)

### Option 1: Only on Vercel (Recommended)
Use Vercel's endpoint for cron jobs to avoid duplicate messages:

**Vercel Cron Setup** (via external service like cron-job.org):
```
URL: https://deeps-14.vercel.app/api/cron/proactive?secret=<VERCEL_CRON_SECRET>
Schedule: Every 30 minutes
```

### Option 2: Separate Schedules
- **Vercel**: Every 30 minutes (primary)
- **Render**: Every 2 hours (backup/monitoring)

⚠️ **Warning**: Don't run same cron job on both at same time - you'll send duplicate messages!

## Cost Breakdown

### Vercel:
- **Free tier**: 100GB bandwidth, unlimited deployments
- **Pro**: $20/month (if you exceed free tier)

### Render:
- **Free tier**: 750 hours/month (enough for one service)
- **Starter**: $7/month (no spin-down)

**Total Cost** (both free tiers): **$0/month**

**Recommended Production Setup**:
- Vercel Free tier: $0/month (primary)
- Render Free tier: $0/month (backup)
- **Total**: $0/month ✅

## Production Checklist

Before going live with both deployments:

### Vercel (Production):
- [ ] All environment variables set
- [ ] Custom domain configured (optional)
- [ ] Telegram webhook set to Vercel URL
- [ ] SSL certificate active (automatic)
- [ ] Cron job pointing to Vercel
- [ ] Tested chat, Telegram, push notifications

### Render (Staging/Backup):
- [ ] All environment variables set
- [ ] Different Telegram bot configured
- [ ] Webhook set to Render URL
- [ ] Tested basic functionality
- [ ] Set up ping service (if using free tier)

## Switching Between Deployments

### Make Render Your Primary:
1. Update your Telegram webhook to Render URL
2. Update cron job to Render URL
3. Share Render URL with users

### Rollback to Vercel:
1. Update Telegram webhook back to Vercel
2. Update cron job back to Vercel
3. Share Vercel URL with users

## Troubleshooting Both Deployments

### Issue: Both deployments receive Telegram messages
**Solution**: Check that you're using different bots or only one webhook is active

### Issue: Duplicate proactive messages
**Solution**: Only set up cron job for one platform, or stagger schedules significantly

### Issue: One deployment works, other doesn't
**Solution**: Compare environment variables between platforms - they should be identical except for `NEXT_PUBLIC_SITE_URL`

### Issue: Supabase rate limits
**Solution**: Both deployments share the same database - if you hit rate limits, you may need to upgrade Supabase plan

## Advanced: Custom Domains on Both

### Vercel:
- `app.yourdomain.com` → Production

### Render:
- `staging.yourdomain.com` → Staging

This makes it clear which deployment you're using!

## Recommended Setup for Production

```
GitHub (main branch)
    ↓
    ├─→ Vercel (app.yourdomain.com) - PRODUCTION
    │   • Real users
    │   • Production Telegram bot
    │   • Cron jobs enabled
    │
    └─→ Render (staging.yourdomain.com) - STAGING
        • Testing new features
        • Staging Telegram bot
        • No cron jobs (or separate schedule)
```

## Summary

| Feature | Vercel (Production) | Render (Staging) |
|---------|-------------------|------------------|
| **Purpose** | Real users | Testing/Backup |
| **URL** | deeps-14.vercel.app | deeps-ai-partner.onrender.com |
| **Telegram Bot** | Production bot | Staging bot |
| **Cron Jobs** | Every 30 min | Disabled or separate schedule |
| **Cost** | Free tier | Free tier |
| **Reliability** | Very high | Good (spins down on free) |
| **Speed** | Very fast | Fast (cold starts on free) |

Both deployments are ready! 🎉 You now have production on Vercel and staging on Render, all deploying automatically from GitHub.
