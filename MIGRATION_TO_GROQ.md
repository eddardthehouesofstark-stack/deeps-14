# Migration from OpenAI to Groq

This document describes the changes made to switch the AI backend from OpenAI to Groq.

## What Changed

### 1. Dependencies
- **Removed**: `openai` package (v4.86.1)
- **Added**: `groq-sdk` package (v0.8.0)

### 2. Environment Variables
- **Removed**: 
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- **Added**:
  - `GROQ_API_KEY` - Your Groq API key from https://console.groq.com
  - `GROQ_MODEL` - Default: `llama-3.3-70b-versatile`

### 3. Code Changes

#### Chat Route (`app/api/chat/route.ts`)
- Switched from OpenAI's chat completion API to Groq's chat completion API
- Changed from OpenAI's proprietary `responses.create()` format to standard chat completions
- System instructions now passed as a system message in the messages array

#### Proactive Messages (`lib/proactive.ts`)
- Updated to use Groq SDK
- Changed message generation to use standard chat completion format

## Groq-Supported Models

Groq offers ultra-fast inference for several open-source models:

### Recommended Models

1. **llama-3.1-70b-versatile** (Default)
   - Best for general conversation and creative tasks
   - 70B parameters, excellent quality
   - Very fast inference

2. **llama-3.3-70b-versatile**
   - Newer model, check availability in your region
   - May require special access

3. **mixtral-8x7b-32768**
   - Good balance of speed and quality
   - Large context window (32k tokens)
   - Very fast inference

4. **llama-3.1-8b-instant**
   - Fastest option for simple tasks
   - Ultra-responsive
   - Lower quality but very fast

### Other Available Models
- `gemma2-9b-it`
- `gemma-7b-it`
- `llama-3.2-90b-text-preview`

Check current models at: https://console.groq.com/docs/models

## Steps to Complete Migration

### 1. Install New Dependencies

```bash
npm install
```

This will remove the `openai` package and install `groq-sdk`.

### 2. Get a Groq API Key

1. Go to https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

### 3. Update Environment Variables

Update your `.env.local` file (or production environment variables):

```bash
# Remove these:
# OPENAI_API_KEY=...
# OPENAI_MODEL=...

# Add these:
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 4. Redeploy

Deploy the updated application to your hosting provider with the new environment variables.

## API Rate Limits

Groq's free tier includes:
- 30 requests per minute
- 7,000 requests per day

For higher limits, check Groq's pricing page.

## Benefits of Groq

1. **Speed**: Groq's LPU (Language Processing Unit) provides extremely fast inference
2. **Cost**: Competitive pricing, free tier available
3. **Open Source Models**: Access to Llama, Mixtral, and Gemma models
4. **No OpenAI Lock-in**: More flexibility with model choices

## Rollback Instructions

If you need to roll back to OpenAI:

1. Checkout the previous commit before this migration
2. Run `npm install`
3. Restore your `OPENAI_API_KEY` and `OPENAI_MODEL` environment variables
4. Redeploy

## Testing

After migration, test these features:
- [ ] Chat messages work correctly
- [ ] Proactive messages are generated and delivered
- [ ] Message quality is acceptable
- [ ] Response times are satisfactory
- [ ] No API errors in logs

## Troubleshooting

### "API key not found" error
- Verify `GROQ_API_KEY` is set in your environment
- Check the key is valid at https://console.groq.com

### Slow responses or timeouts
- Try a faster model like `llama-3.1-8b-instant`
- Check Groq's status page for any outages

### Different message quality
- Adjust the `temperature` parameter in the API calls
- Try different models to find the best fit
- Current settings: 0.7 for chat, 0.8 for proactive messages

## Support

- Groq Documentation: https://console.groq.com/docs
- Groq Discord: https://groq.com/discord
- GitHub Issues: Create an issue in your repository
