import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.subscription?.endpoint || !body?.subscription?.keys?.p256dh || !body?.subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("web_push_subscriptions").upsert({
    user_id: user.id, endpoint: body.subscription.endpoint, subscription: body.subscription, updated_at: new Date().toISOString()
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Could not save push subscription." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("web_push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: "Could not remove push subscription." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
