import Groq from "groq-sdk";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Profile = {
  id: string; display_name: string | null; timezone: string; checkins_enabled: boolean;
  checkin_time: string; last_proactive_date: string | null; telegram_chat_id: string | null;
};

function localParts(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

function dueNow(profile: Profile, now: Date) {
  try {
    const local = localParts(profile.timezone || "Asia/Kolkata", now);
    if (profile.last_proactive_date === local.date) return false;
    const [h, m] = (profile.checkin_time || "09:00").slice(0, 5).split(":").map(Number);
    const [lh, lm] = local.time.split(":").map(Number);
    const current = lh * 60 + lm;
    const due = h * 60 + m;
    // Cron can run every 5 minutes; allow a 15-minute delivery window.
    return current >= due && current < due + 15;
  } catch { return false; }
}

async function makeMessage(userId: string, displayName: string | null) {
  const admin = createAdminClient();
  const [{ data: memories }, { data: history }] = await Promise.all([
    admin.from("memories").select("content, category").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    admin.from("chat_messages").select("role, content, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
  ]);
  const context = (history || []).reverse().map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");
  const memoryText = (memories || []).map((m: { content: string }) => `- ${m.content}`).join("\n");
  
  const systemPrompt = `You are deeps, a warm, playful, emotionally attentive AI companion. Generate ONE original proactive message to start today's conversation. Do not ask the user to initiate first. Use relevant context if available, and don't invent facts or claim human feelings. Avoid guilt, pressure, possessiveness, or implying the user owes a reply. Keep it natural, 1-3 sentences, with at most one gentle emoji. Vary the opening; do not sound like a scheduled reminder. The user may be quiet or may have shared something important previously. If no context exists, start a genuinely curious, warm conversation. Address them by name only if a preferred name is explicitly known.`;
  
  const userContext = `Preferred display name (may be blank): ${displayName || "not provided"}\nUser-approved memories:\n${memoryText || "none"}\nRecent conversation (oldest to newest):\n${context || "no previous conversation"}\n\nWrite the message deeps would initiate today.`;
  
  const result = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContext }
    ],
    temperature: 0.8,
    max_tokens: 256,
  });
  
  return (result.choices[0]?.message?.content || "Hey you 💗 Just wanted to start a conversation today. How's your day going so far?").trim().slice(0, 900);
}

async function sendTelegram(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
  if (!response.ok) throw new Error(`Telegram delivery failed: ${response.status}`);
}

async function sendPush(subscription: any, message: string) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Web Push VAPID keys are not configured.");
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);
  await webpush.sendNotification(subscription, JSON.stringify({ title: "deeps 💗", body: message, url: "/" }));
}

export async function sendProactiveMessage(profile: Profile, message?: string) {
  const admin = createAdminClient();
  const { data: subscriptions } = await admin.from("web_push_subscriptions")
    .select("id, subscription").eq("user_id", profile.id);
  if (!profile.telegram_chat_id && !(subscriptions || []).length) {
    return { deliveries: [] as string[], errors: ["No delivery channel is connected."], message: "" };
  }
  const content = message || await makeMessage(profile.id, profile.display_name);
  const deliveries: string[] = [];
  const errors: string[] = [];

  if (profile.telegram_chat_id) {
    try { await sendTelegram(profile.telegram_chat_id, content); deliveries.push("telegram"); }
    catch (e) { errors.push(`telegram: ${e instanceof Error ? e.message : "failed"}`); }
  }

  for (const item of subscriptions || []) {
    try { await sendPush(item.subscription, content); deliveries.push("web_push"); }
    catch (e: any) {
      const status = e?.statusCode;
      errors.push(`web_push: ${status || "failed"}`);
      if (status === 404 || status === 410) await admin.from("web_push_subscriptions").delete().eq("id", item.id);
    }
  }

  if (deliveries.length) {
    await admin.from("chat_messages").insert({ user_id: profile.id, role: "assistant", content, source: "proactive" });
    await admin.from("proactive_deliveries").insert({ user_id: profile.id, local_date: localParts(profile.timezone || "Asia/Kolkata").date, message: content, channels: deliveries, errors });
  }
  return { deliveries, errors, message: content };
}

export { dueNow, localParts, type Profile };
