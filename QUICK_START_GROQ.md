# Quick Start: Groq Migration

Your Deeps AI Partner has been successfully migrated from OpenAI to Groq! Here's how to get it running.

## ✅ What's Done

All code changes are complete:
- ✅ Groq SDK installed in package.json
- ✅ Chat API updated to use Groq
- ✅ Proactive messaging updated to use Groq
- ✅ Environment variables updated
- ✅ Documentation updated

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Groq API Key

1. Visit https://console.groq.com
2. Sign up (it's free!)
3. Go to "API Keys" section
4. Click "Create API Key"
5. Copy your key (starts with `gsk_`)

### 3. Update Your Environment File

If you have a `.env.local` file, update it:

```bash
# Remove these old variables:
# OPENAI_API_KEY=...
# OPENAI_MODEL=...

# Add these new variables:
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

If you don't have a `.env.local` yet, copy from example:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Groq key plus all other required variables (Supabase, Telegram, etc.).

### 4. Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and try chatting!

### 5. Deploy

Update your production environment variables:
- Remove: `OPENAI_API_KEY`, `OPENAI_MODEL`
- Add: `GROQ_API_KEY=gsk_your_key_here`, `GROQ_MODEL=llama-3.3-70b-versatile`

Then deploy as usual.

## 🎯 Recommended Model Settings

### For General Use (Default)
```bash
GROQ_MODEL=llama-3.1-70b-versatile
```
- Best balance of quality and speed
- Very fast inference
- Excellent conversational ability

### For Faster Responses
```bash
GROQ_MODEL=llama-3.1-8b-instant
```
- Ultra-fast (~750 tokens/second)
- Good quality for simple conversations
- Great for high-traffic applications

### For Long Conversations
```bash
GROQ_MODEL=mixtral-8x7b-32768
```
- Large 32k context window
- Good quality
- ~480 tokens/second

## 📊 What to Expect

### Speed Improvements
- **OpenAI GPT-4**: ~20-40 tokens/sec
- **Groq Llama 3.3**: ~280 tokens/sec
- **Result**: Up to 14x faster responses! ⚡

### Quality
- Llama 3.3 70B performs comparably to GPT-3.5
- Personality and tone are preserved
- Context memory works identically

### Costs
- Groq's free tier: 30 requests/min, 7,000 requests/day
- Very generous for personal projects
- Paid plans available for production scale

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Chat messages send and receive properly
- [ ] Conversation history is maintained
- [ ] Memories are considered in responses
- [ ] Proactive messages are generated (if scheduled)
- [ ] Telegram notifications work (if configured)
- [ ] Web push notifications work (if configured)
- [ ] No errors in server logs

## 🆘 Troubleshooting

### "API key not found"
- Check `GROQ_API_KEY` is set in your environment
- Verify it starts with `gsk_`
- Make sure you restarted the dev server after changing .env.local

### "Model not found"
- Check `GROQ_MODEL` value matches an available model
- Default `llama-3.3-70b-versatile` should always work
- See all models at: https://console.groq.com/docs/models

### Slow or timeout errors
- Groq is usually very fast, but check their status page
- Try a different model like `llama-3.1-8b-instant`
- Check your internet connection

### Different response style
- Llama models have a different "voice" than GPT
- Adjust temperature in the code if needed (currently 0.7 for chat, 0.8 for proactive)
- Try different models to find your preferred style

## 📚 Additional Resources

- **Groq Documentation**: https://console.groq.com/docs
- **Model Comparison**: https://console.groq.com/docs/models
- **Rate Limits**: https://console.groq.com/docs/rate-limits
- **Support**: https://groq.com/discord

## 🔄 Need to Rollback?

If you need to go back to OpenAI:

```bash
# Checkout the previous version
git checkout HEAD~1

# Reinstall dependencies
npm install

# Restore your OpenAI environment variables
# Then redeploy
```

## 💡 Pro Tips

1. **Monitor Usage**: Check your Groq dashboard to track API usage
2. **Cache Responses**: Consider caching for repeated queries
3. **Rate Limiting**: Implement rate limiting in production
4. **Error Handling**: The code already has good error handling, but monitor logs
5. **A/B Testing**: Try different models to find the best fit for your users

---

**That's it!** Your AI companion is now powered by Groq's ultra-fast inference. Enjoy the speed boost! 🚀
