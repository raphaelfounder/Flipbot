import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const verified = url.searchParams.get("verified") === "1";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  if (verified && !url.searchParams.has("error")) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?message=Email+confirmed.+Sign+in+to+continue.", url.origin),
    );
  }

  return NextResponse.redirect(new URL("/auth/sign-in?message=That+email+link+is+invalid+or+has+expired.", url.origin));
}
