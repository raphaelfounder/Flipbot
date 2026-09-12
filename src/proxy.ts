import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only refresh Supabase sessions on routes that actually read account data.
  // Public marketing, legal and auth form pages must remain renderable before
  // deployment environment variables are configured.
  matcher: ["/app/:path*", "/api/account/:path*"],
};
