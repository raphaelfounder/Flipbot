import { NextResponse } from "next/server";

import { requireUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function GET() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: settings }, { data: searches }, { data: results }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("search_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("search_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify({
    exported_at: exportedAt,
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
    },
    profile,
    settings,
    searches: searches ?? [],
    search_results: results ?? [],
  }, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="flipbot-data-${exportedAt.slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
