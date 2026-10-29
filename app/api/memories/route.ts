import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("memories")
    .select("id, content, category, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load memories." }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const category = typeof body.category === "string" ? body.category.slice(0, 40) : "user_shared";
  if (!content || content.length > 500) return NextResponse.json({ error: "Memory must be 1–500 characters." }, { status: 400 });

  const { data, error } = await supabase.from("memories")
    .insert({ user_id: user.id, content, category }).select("id, content, category, created_at").single();
  if (error) return NextResponse.json({ error: "Could not save memory." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing memory id." }, { status: 400 });
  const { error } = await supabase.from("memories").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete memory." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
