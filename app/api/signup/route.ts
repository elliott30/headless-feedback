import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { headers } from "next/headers";

function generateAccountId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "acc_";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  const supabase = getSupabase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo)
    .eq("ip", ip);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Too many signups from this IP. Try again later." },
      { status: 429 }
    );
  }

  const accountId = generateAccountId();

  const { data, error } = await supabase
    .from("accounts")
    .insert({ account_id: accountId, ip })
    .select("api_key, account_id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  return NextResponse.json({ apiKey: data.api_key, accountId: data.account_id });
}
