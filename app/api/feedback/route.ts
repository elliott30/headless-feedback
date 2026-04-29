import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("feedback")
    .select("id, content, created_at, upvotes(count)")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }

  const items = data.map((row) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    upvotes: (row.upvotes as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { accountId, content } = body ?? {};

  if (!accountId || typeof content !== "string") {
    return NextResponse.json({ error: "accountId and content required" }, { status: 400 });
  }

  if (content.trim().length < 4) {
    return NextResponse.json({ error: "Feedback too short" }, { status: 422 });
  }

  const supabase = getSupabase();

  const { data: account } = await supabase
    .from("accounts")
    .select("account_id")
    .eq("account_id", accountId)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Invalid accountId" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("feedback")
    .insert({ account_id: accountId, content: content.trim() })
    .select("id, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
