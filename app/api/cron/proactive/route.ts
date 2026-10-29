import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dueNow, sendProactiveMessage, type Profile } from "@/lib/proactive";

export const runtime = "nodejs";
export const maxDuration = 60;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: profiles, error } = await admin.from("profiles")
    .select("id, display_name, timezone, checkins_enabled, checkin_time, last_proactive_date, telegram_chat_id")
    .eq("checkins_enabled", true);
  if (error) return NextResponse.json({ error: "Could not load profiles." }, { status: 500 });
  const results = [];
  const now = new Date();
  for (const raw of profiles || []) {
    const profile = raw as Profile;
    if (!dueNow(profile, now)) continue;
    // Claim today's date before delivery to avoid duplicate sends from overlapping cron invocations.
    const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: profile.timezone || "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const get = (k: string) => dateParts.find(p => p.type === k)?.value || "00";
    const localDate = `${get("year")}-${get("month")}-${get("day")}`;
    const claim = await admin.from("profiles").update({ last_proactive_date: localDate }).eq("id", profile.id).or(`last_proactive_date.is.null,last_proactive_date.neq.${localDate}`).select("id");
    if (claim.error || !claim.data?.length) continue;
    try {
      const result = await sendProactiveMessage(profile);
      results.push({ userId: profile.id, ...result });
      // Only retry when no channel exists at all; don't repeatedly call the AI if a configured channel fails.
      if (result.errors.includes("No delivery channel is connected.")) {
        await admin.from("profiles").update({ last_proactive_date: null }).eq("id", profile.id).eq("last_proactive_date", localDate);
      }
    } catch (e) {
      results.push({ userId: profile.id, error: e instanceof Error ? e.message : "Generation failed" });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
