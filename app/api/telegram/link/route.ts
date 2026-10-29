import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.TELEGRAM_BOT_USERNAME) return NextResponse.json({ error: "Telegram bot is not configured yet." }, { status: 503 });
  const code = randomBytes(5).toString("hex").toUpperCase();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({
    telegram_link_code: code,
    telegram_link_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not create a Telegram link code. Run the latest schema migration." }, { status: 500 });
  return NextResponse.json({ code, botUrl: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${code}` });
}

export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ telegram_chat_id: null, telegram_username: null, telegram_link_code: null, telegram_link_expires_at: null }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not disconnect Telegram." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
