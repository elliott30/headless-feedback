import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { feedbackId, voterId } = body ?? {};

  if (!feedbackId || !voterId) {
    return NextResponse.json({ error: "feedbackId and voterId required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { error: insertError } = await supabase
    .from("upvotes")
    .insert({ feedback_id: feedbackId, voter_id: voterId });

  if (insertError) {
    if (insertError.code === "23505") {
      await supabase
        .from("upvotes")
        .delete()
        .eq("feedback_id", feedbackId)
        .eq("voter_id", voterId);
      return NextResponse.json({ upvoted: false });
    }
    return NextResponse.json({ error: "Failed to toggle upvote" }, { status: 500 });
  }

  return NextResponse.json({ upvoted: true });
}
