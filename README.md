# deeps — proactive AI companion starter

Deeps can initiate an original conversation each day using saved memories and recent chat context, then deliver it to **Telegram and/or browser Web Push**. The AI chooses the wording; the daily time is only a delivery window. This is a deployable starter scaffold, not a hosted or fully audited service. It does not run until you configure the secrets, apply the schema, deploy it, connect delivery channels, and schedule the protected cron endpoint.

## Included

- Supabase email/password authentication and row-level security
- AI chat and user-managed memories
- Conversation history stored server-side for contextual proactive messages
- Daily proactive-message generator and idempotent scheduler endpoint
- Telegram account linking, outbound messages, and conversational replies
- Browser Push API subscription endpoint and service worker
- Delivery logging and cleanup of expired push subscriptions

## Requirements

- Node.js 20+
- Supabase project
- Groq API key (free tier available at https://console.groq.com)
- Public HTTPS deployment for browser push and Telegram webhook
- Telegram bot (create one through `@BotFather`)
- A scheduler/cron provider that can call an endpoint every 5 minutes

## 1. Install and configure

```bash
npm install
cp .env.example .env.local
```

Fill in all required environment variables. **Never expose `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`, or `VAPID_PRIVATE_KEY` in client-side code.**

Generate Web Push VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Put the public/private values into `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to a real contact address such as `mailto:you@example.com`. Generate long random secrets for `CRON_SECRET` and `TELEGRAM_WEBHOOK_SECRET`; Telegram's `secret_token` supports letters, numbers, underscores, and hyphens.

## 2. Apply the database schema

Run the full `supabase/schema.sql` in Supabase SQL Editor. It creates/extends profiles, memories, chat history, push subscriptions, and delivery logs. Keep the service-role key server-only. Supabase Auth email/password should be enabled.

## 3. Configure Telegram

1. Create a bot with `@BotFather` and copy its token into `TELEGRAM_BOT_TOKEN`.
2. Put the bot's username (without `@`) in `TELEGRAM_BOT_USERNAME`.
3. Deploy the app to HTTPS before setting the webhook.
4. Set the webhook using the deployed URL and the same secret configured in `.env.local`:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://YOUR_DOMAIN/api/telegram/webhook","secret_token":"YOUR_TELEGRAM_WEBHOOK_SECRET"}'
```

Use your actual values. Then sign in to Deeps, click **Connect Telegram**, and press **Start** in the opened bot chat. Telegram only allows the bot to message a user after that user starts the bot.

## 4. Configure browser notifications

Browser push requires HTTPS (localhost is okay for local development), permission from the user, and VAPID keys. Sign in to Deeps and click **Enable website notifications**. The browser stores a push subscription on your account. Notifications can be delivered while the page is closed, depending on browser/OS notification settings.

## 5. Start locally

```bash
npm run dev
```

Open `http://localhost:3000`. The browser push flow is best tested on localhost or HTTPS. Telegram's webhook requires a public HTTPS deployment/tunnel.

## 6. Schedule proactive messages

Deploy the app, set `CRON_SECRET`, and configure your cron provider to call the endpoint **every 5 minutes** with this header:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

Endpoint:

```text
POST https://YOUR_DOMAIN/api/cron/proactive
```

A cron provider must call this regularly; a browser tab cannot reliably run background jobs. The endpoint checks each opted-in user's local timezone and preferred delivery time, then generates at most one delivered message per local date. A daily-only cron is not sufficient for users in multiple time zones. Keep the endpoint secret private and never expose it in the website.

## 7. How the behavior works

- Deeps generates an original message from recent conversation and user-approved memories; it does not use a prewritten daily script.
- The user opts in to daily proactive messages and chooses a local delivery time.
- Delivery is attempted on each connected channel. The AI does not literally have human feelings or independently run itself; the scheduled backend provides the initiative.
- The scheduler does not send if no channel is connected. Failed/expired Web Push subscriptions are removed when the push service reports them expired.
- Deeps avoids guilt, pressure, possessiveness, and claims that the user owes a response.

## Before production

Add automated tests, rate limiting, request-size limits, monitoring/alerts, a privacy/data export and deletion flow, and a reviewed retention policy. Configure backups and rotate secrets appropriately. Review Supabase and Groq data/retention settings. Do not use this starter as a substitute for professional mental-health care.
