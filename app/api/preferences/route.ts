import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("profiles")
    .select("checkins_enabled, checkin_time, timezone, telegram_chat_id")
    .eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load preferences." }, { status: 500 });
  const admin = createAdminClient();
  const { count } = await admin.from("web_push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  return NextResponse.json({
    checkins_enabled: data?.checkins_enabled ?? false,
    checkin_time: data?.checkin_time || "09:00",
    timezone: data?.timezone || "Asia/Kolkata",
    telegram_connected: Boolean(data?.telegram_chat_id),
    web_push_connected: (count || 0) > 0
  });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const checkins_enabled = Boolean(body.checkins_enabled);
  const checkin_time = typeof body.checkin_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.checkin_time)
    ? body.checkin_time : "09:00";
  const timezone = typeof body.timezone === "string" && body.timezone.length < 80
    ? body.timezone : "Asia/Kolkata";
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }); }
  catch { return NextResponse.json({ error: "Invalid time zone." }, { status: 400 }); }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({
    checkins_enabled, checkin_time, timezone, updated_at: new Date().toISOString()
  }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save preferences. Run the latest database schema." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
