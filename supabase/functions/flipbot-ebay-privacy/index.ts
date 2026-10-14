import { createClient } from "npm:@supabase/supabase-js@2.112.3";

// Uses the existing server-only Flipbot gateway credential; never log its value.
const EXPECTED_KEY_HASH = "8110a83fb6fe882ea0f712091d3fbee279444c009996c59ae0f821d1c1fe7b7e";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const key = request.headers.get("x-flipbot-internal-key") ?? "";
  if (!key || key.length > 4096) return json({ error: "Unauthorized" }, 401);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  if (hash !== EXPECTED_KEY_HASH) return json({ error: "Unauthorized" }, 401);
  try {
    const body = await request.json();
    if (body?.action !== "process_ebay_deletion") return json({ error: "Unknown action" }, 400);
    const notice = body.payload;
    if (!notice || typeof notice.notificationId !== "string" || typeof notice.userId !== "string") {
      return json({ error: "Invalid notification" }, 400);
    }
    const database = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await database.rpc("flipbot_process_ebay_api_deletion", {
      p_notification_id: notice.notificationId, p_user_id: notice.userId,
      p_username: notice.username ?? null, p_eias_token: notice.eiasToken ?? null,
    });
    if (error) return json({ error: "Deletion processing failed" }, 503);
    return json(data);
  } catch { return json({ error: "Deletion processing failed" }, 503); }
});
