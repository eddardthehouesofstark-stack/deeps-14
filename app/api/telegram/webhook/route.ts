import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function telegramSend(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3900) })
  });
}

export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || supplied !== expected) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = typeof message?.text === "string" ? message.text.trim() : "";
  if (!chatId || !text) return NextResponse.json({ ok: true });
  const admin = createAdminClient();

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1]?.toUpperCase();
    if (!code) {
      await telegramSend(chatId, "To connect me to your Deeps account, open Deeps → Notifications → Connect Telegram and use the personal link there 💗");
      return NextResponse.json({ ok: true });
    }
    const { data: profile } = await admin.from("profiles").select("id, telegram_link_expires_at").eq("telegram_link_code", code).maybeSingle();
    if (!profile || !profile.telegram_link_expires_at || new Date(profile.telegram_link_expires_at).getTime() < Date.now()) {
      await telegramSend(chatId, "That link code is invalid or expired. Please generate a fresh Telegram link in your Deeps settings.");
      return NextResponse.json({ ok: true });
    }
    await admin.from("profiles").update({ telegram_chat_id: String(chatId), telegram_username: message.from?.username || null, telegram_link_code: null, telegram_link_expires_at: null }).eq("id", profile.id);
    await telegramSend(chatId, "You're connected to Deeps 💗 I'll be able to send you your daily conversation starters here. You can disconnect anytime from your Deeps settings.");
    return NextResponse.json({ ok: true });
  }

  const { data: profile } = await admin.from("profiles").select("id, display_name").eq("telegram_chat_id", String(chatId)).maybeSingle();
  if (!profile) {
    await telegramSend(chatId, "I'm Deeps 💗 To connect this chat to your private account, open Deeps → Notifications → Connect Telegram first.");
    return NextResponse.json({ ok: true });
  }

  const [{ data: memories }, { data: history }] = await Promise.all([
    admin.from("memories").select("content, category").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(20),
    admin.from("chat_messages").select("role, content").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(16)
  ]);
  await admin.from("chat_messages").insert({ user_id: profile.id, role: "user", content: text, source: "chat" });
  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `You are deeps, a warm, playful, caring AI companion. Reply naturally to the user's Telegram message. Use memories and conversation context, don't invent facts or claim human feelings, and never pressure the user to reply or suggest they should rely only on you. Keep it concise enough for a chat.`,
      input: `Name if known: ${profile.display_name || "not provided"}\nMemories:\n${(memories || []).map((m: { content: string }) => `- ${m.content}`).join("\n") || "none"}\nRecent chat, oldest first:\n${(history || []).reverse().map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${text}`,
      store: false
    });
    const reply = response.output_text || "I'm here 💗 Tell me a little more?";
    await admin.from("chat_messages").insert({ user_id: profile.id, role: "assistant", content: reply, source: "chat" });
    await telegramSend(chatId, reply);
  } catch (error) {
    console.error("Telegram reply error", error);
    await telegramSend(chatId, "I couldn't put together a reply just now. Try me again in a moment 💗");
  }
  return NextResponse.json({ ok: true });
}
