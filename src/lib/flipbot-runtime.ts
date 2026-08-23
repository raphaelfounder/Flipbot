import "server-only";

export type RuntimeCatalogueVariant = {
  variant_id: string;
  canonical_name: string;
  normalized_name: string | null;
  brand: string;
  model: string;
  category_path: string | null;
  value_attributes: Record<string, unknown>;
  cex_sell_price_minor: number | null;
  marketplace_reference_minor: number | null;
  valuation_low_minor: number | null;
  valuation_central_minor: number | null;
  valuation_high_minor: number | null;
  valuation_confidence: number | null;
  valuation_comp_count: number | null;
  valuation_verified_at: string | null;
  cache_valid_until: string | null;
};

export type RuntimeSearch = {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "PARTIAL" | "FAILED";
  stage: string;
  source: string;
  provider_snapshot_id: string | null;
  provider_status: string | null;
  request_payload: Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  marketplace_records_received: number;
  unseen_analyzed: number;
  duplicates_skipped: number;
  database_matches: number;
  cache_hits: number;
  stale_valuations: number;
  live_validations: number;
  sold_records_retrieved: number;
  top_10_qualifiers: number;
  marketplace_cost_micros: number;
  ebay_cost_micros: number;
  cex_used: boolean;
  partial_reason: string | null;
};

export type RuntimeSearchResult = Record<string, unknown>;

type RuntimeResponse = {
  search?: RuntimeSearch;
  results?: RuntimeSearchResult[];
  catalogue?: RuntimeCatalogueVariant[];
  valuationId?: string;
  complete?: boolean;
  error?: string;
};

export function getRuntimeConfiguration() {
  return Boolean(process.env.FLIPBOT_RUNTIME_URL && process.env.FLIPBOT_RUNTIME_KEY);
}

export async function createRuntimeSearch(input: Record<string, unknown>, snapshotId: string) {
  const response = await runtimeRequest("create_search", { input, snapshotId });
  if (!response.search) throw new Error("Search persistence did not return a search record.");
  return response.search;
}

export async function getRuntimeSearch(searchId: string) {
  const response = await runtimeRequest("get_search", { searchId });
  if (!response.search) throw new Error("Search record was not found.");
  return { search: response.search, results: response.results ?? [] };
}

export async function updateRuntimeSearch(searchId: string, patch: Record<string, unknown>) {
  const response = await runtimeRequest("update_search", { searchId, patch });
  if (!response.search) throw new Error("Search status could not be updated.");
  return response.search;
}

export async function getRuntimeCatalogue(query: string, category: string, limit = 600) {
  const response = await runtimeRequest("catalogue", { query, category, limit });
  return response.catalogue ?? [];
}

export async function storeRuntimeValuation(payload: Record<string, unknown>) {
  const response = await runtimeRequest("store_valuation", payload);
  if (!response.valuationId) throw new Error("Verified valuation was not persisted.");
  return response.valuationId;
}

export async function completeRuntimeSearch(payload: Record<string, unknown>) {
  const response = await runtimeRequest("complete_search", payload);
  if (!response.complete) throw new Error("Search results were not persisted.");
}

async function runtimeRequest(action: string, payload: Record<string, unknown>): Promise<RuntimeResponse> {
  const endpoint = process.env.FLIPBOT_RUNTIME_URL;
  const internalKey = process.env.FLIPBOT_RUNTIME_KEY;
  if (!endpoint || !internalKey) throw new Error("Flipbot database runtime is not configured.");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-flipbot-internal-key": internalKey,
      },
      body: JSON.stringify({ action, payload }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("Flipbot could not reach its database runtime.");
  }

  const body = await response.json().catch(() => ({})) as RuntimeResponse;
  if (!response.ok) throw new Error(body.error || "Flipbot database operation failed.");
  return body;
}
