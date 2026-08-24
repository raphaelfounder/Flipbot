import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const EXPECTED_KEY_HASH = "8110a83fb6fe882ea0f712091d3fbee279444c009996c59ae0f821d1c1fe7b7e";

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function requiredUserId(payload: Record<string, unknown>) {
  const userId = typeof payload.userId === "string" ? payload.userId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("Authenticated user context is required.");
  }
  return userId;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const suppliedKey = request.headers.get("x-flipbot-internal-key") ?? "";
  if (!suppliedKey || await sha256(suppliedKey) !== EXPECTED_KEY_HASH) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Runtime configuration unavailable" }, 503);

  const database = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "";
    const payload = body?.payload && typeof body.payload === "object" ? body.payload as Record<string, unknown> : {};

    if (action === "create_search") {
      const userId = requiredUserId(payload);
      const input = payload.input && typeof payload.input === "object" ? payload.input as Record<string, unknown> : {};
      const { data, error } = await database.from("search_sessions").insert({
        user_id: userId,
        status: "PENDING",
        stage: "FINDING_LISTINGS",
        source: input.source ?? "Facebook",
        provider_snapshot_id: payload.snapshotId,
        provider_status: "starting",
        request_payload: input,
        location_label: input.location ?? null,
        radius_km: typeof input.radius === "number" ? input.radius * 1.609344 : null,
        category_path: input.category ?? null,
        product_query: input.query ?? null,
        budget_minor: Math.round(Number(input.maximumBuyPrice ?? 0) * 100),
        currency: "GBP",
        marketplace_records_requested: 100,
      }).select("*").single();
      if (error) throw error;
      return json({ search: data });
    }

    if (action === "get_search") {
      const userId = requiredUserId(payload);
      const searchId = String(payload.searchId ?? "");
      const { data: search, error: searchError } = await database
        .from("search_sessions").select("*").eq("id", searchId).eq("user_id", userId).single();
      if (searchError) throw searchError;
      const { data: results, error: resultError } = await database
        .from("search_results").select("*").eq("search_id", searchId).eq("user_id", userId).order("flip_score", { ascending: false });
      if (resultError) throw resultError;
      return json({ search, results: results ?? [] });
    }

    if (action === "update_search") {
      const userId = requiredUserId(payload);
      const searchId = String(payload.searchId ?? "");
      const patch = payload.patch && typeof payload.patch === "object" ? payload.patch as Record<string, unknown> : {};
      const allowed = [
        "status", "stage", "provider_status", "error_code", "error_message",
        "marketplace_records_received", "partial_reason", "marketplace_cost_micros", "ebay_cost_micros", "updated_at",
      ];
      const update = Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.includes(key)));
      update.updated_at = new Date().toISOString();
      const { data, error } = await database.from("search_sessions")
        .update(update).eq("id", searchId).eq("user_id", userId).select("*").single();
      if (error) throw error;
      return json({ search: data });
    }

    if (action === "catalogue") {
      const { data, error } = await database.rpc("flipbot_runtime_catalogue", {
        p_query: String(payload.query ?? ""),
        p_category: String(payload.category ?? ""),
        p_limit: Math.min(Math.max(Number(payload.limit ?? 600), 1), 3000),
      });
      if (error) throw error;
      return json({ catalogue: data ?? [] });
    }

    if (action === "store_valuation") {
      const { data, error } = await database.rpc("flipbot_store_runtime_valuation", {
        p_variant_id: payload.variantId,
        p_low_minor: payload.lowMinor,
        p_central_minor: payload.centralMinor,
        p_high_minor: payload.highMinor,
        p_relevant_sales_30d: payload.relevantSales30d,
        p_comps: payload.comps,
      });
      if (error) throw error;
      return json({ valuationId: data });
    }

    if (action === "complete_search") {
      const userId = requiredUserId(payload);
      const searchId = String(payload.searchId ?? "");
      const { data: ownedSearch, error: ownershipError } = await database.from("search_sessions")
        .select("id").eq("id", searchId).eq("user_id", userId).single();
      if (ownershipError || !ownedSearch) return json({ error: "Search not found" }, 404);

      const { error } = await database.rpc("flipbot_complete_runtime_search", {
        p_search_id: searchId,
        p_status: payload.status,
        p_metrics: payload.metrics ?? {},
        p_results: payload.results ?? [],
      });
      if (error) throw error;
      const metrics = payload.metrics && typeof payload.metrics === "object" ? payload.metrics as Record<string, unknown> : {};
      const { error: costError } = await database.from("search_sessions").update({
        marketplace_cost_micros: Number(metrics.marketplaceCostMicros ?? 0),
        ebay_cost_micros: Number(metrics.ebayCostMicros ?? 0),
      }).eq("id", searchId).eq("user_id", userId);
      if (costError) throw costError;
      return json({ complete: true });
    }

    if (action === "delete_account") {
      const userId = requiredUserId(payload);
      const { error } = await database.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ deleted: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database operation failed";
    return json({ error: message }, message === "Authenticated user context is required." ? 401 : 500);
  }
});
