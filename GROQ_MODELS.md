# Available Groq Models (Updated)

## Current Working Models

Based on the Groq API as of October 2026, here are the **verified working models**:

### ✅ Recommended for Deeps

#### 1. llama-3.1-70b-versatile (Default)
```bash
GROQ_MODEL=llama-3.1-70b-versatile
```
- **Best for**: General conversation, creative responses
- **Parameters**: 70 billion
- **Quality**: Excellent
- **Speed**: Very fast
- **Context**: 8k tokens
- **Use case**: Default choice for deeps companion

#### 2. mixtral-8x7b-32768
```bash
GROQ_MODEL=mixtral-8x7b-32768
```
- **Best for**: Long conversations with context
- **Parameters**: 8x7B (Mixture of Experts)
- **Quality**: Very good
- **Speed**: Very fast
- **Context**: 32k tokens (4x larger!)
- **Use case**: Users who have long chat histories

#### 3. llama-3.1-8b-instant
```bash
GROQ_MODEL=llama-3.1-8b-instant
```
- **Best for**: Ultra-fast responses
- **Parameters**: 8 billion
- **Quality**: Good (lower than 70B)
- **Speed**: Extremely fast
- **Context**: 8k tokens
- **Use case**: High-traffic or cost-sensitive deployments

### Other Available Models

#### gemma2-9b-it
```bash
GROQ_MODEL=gemma2-9b-it
```
- Google's Gemma 2 model
- 9 billion parameters
- Good quality, very fast

#### gemma-7b-it
```bash
GROQ_MODEL=gemma-7b-it
```
- Original Gemma model
- 7 billion parameters
- Fast and efficient

### ⚠️ Models That May Not Be Available

These models appear in Groq's documentation but may require special access or may not be available in all regions:

- `llama-3.3-70b-versatile` - Newer model, check availability
- `llama-3.2-90b-text-preview` - Preview model, may have limited access
- `llama-guard-3-8b` - Safety model, specialized use

## How to Check Available Models

You can check the current list of available models at:
- **Groq Console**: https://console.groq.com/docs/models
- **API Endpoint**: Make a request to list models via the API

## Model Comparison for Deeps

| Model | Quality | Speed | Context | Best For |
|-------|---------|-------|---------|----------|
| llama-3.1-70b-versatile | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | 8k | **Default choice** |
| mixtral-8x7b-32768 | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ | 32k | Long conversations |
| llama-3.1-8b-instant | ⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 8k | Speed priority |
| gemma2-9b-it | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ | 8k | Alternative option |

## Testing a Model

To test if a model is available:

1. Update your `.env.local`:
```bash
GROQ_MODEL=model-name-here
```

2. Restart the dev server:
```bash
npm run dev
```

3. Try sending a chat message

4. Check the console for errors

## Current Default Setting

The code now defaults to:
```typescript
model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile"
```

This is a **safe, tested default** that works well for the deeps companion personality.

## Recommendations by Use Case

### Personal Project (Low Traffic)
```bash
GROQ_MODEL=llama-3.1-70b-versatile
```
Best quality, free tier is plenty.

### Production (Medium Traffic)
```bash
GROQ_MODEL=mixtral-8x7b-32768
```
Great balance, larger context for better memory.

### High Volume (Many Users)
```bash
GROQ_MODEL=llama-3.1-8b-instant
```
Fastest option, consider upgrading to paid plan.

### Maximum Quality
```bash
GROQ_MODEL=llama-3.1-70b-versatile
```
Already excellent, this is the best publicly available option.

## Rate Limits (Free Tier)

- **Requests**: 30 per minute, 7,000 per day
- **Tokens**: Varies by model
- **Upgrade**: Paid plans available for production scale

## Need Help?

- Check model availability: https://console.groq.com/docs/models
- Groq Discord: https://groq.com/discord
- Status page: Check if Groq services are operational

---

**Note**: Model availability can change. Always check the Groq documentation for the most current list.
