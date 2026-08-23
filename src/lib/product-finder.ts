import "server-only";

import type { AppDeal } from "@/lib/app-data";
import {
  completeRuntimeSearch,
  createRuntimeSearch,
  getRuntimeCatalogue,
  getRuntimeConfiguration,
  getRuntimeSearch,
  storeRuntimeValuation,
  updateRuntimeSearch,
  type RuntimeCatalogueVariant,
  type RuntimeSearchResult,
} from "@/lib/flipbot-runtime";

const BRIGHT_DATA_ENDPOINT = "https://api.brightdata.com/datasets/v3/scrape";
const BRIGHT_DATA_TRIGGER_ENDPOINT = "https://api.brightdata.com/datasets/v3/trigger";
const BRIGHT_DATA_PROGRESS_ENDPOINT = "https://api.brightdata.com/datasets/v3/progress";
const SOLD_COMPS_ENDPOINT = "https://api.sold-comps.com/v1/scrape";
const DEFAULT_MARKETPLACE_DATASET = "gd_lvt9iwuh6fbcwmx1a";
const PROVIDER_TIMEOUT_MS = 45_000;
const SNAPSHOT_POLL_INTERVAL_MS = 2_000;
const SNAPSHOT_MAX_POLLS = 8;
const PROVIDER_RETRY_DELAYS_MS = [1_000, 2_000];

export type ProductFinderInput = {
  source: "Facebook" | "eBay";
  query: string;
  category: string;
  maximumBuyPrice: number;
  minimumProfit: number;
  location?: string;
  radius?: number;
  fullValidation?: boolean;
};

type MarketplaceListing = {
  id: string;
  url: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  image: string;
  listedAt?: string;
};

type SoldComp = {
  itemId: string;
  url?: string;
  title: string;
  price: number;
  shipping: number;
  currency: string;
  condition: string;
  endedAt?: string;
  bestOfferAccepted: boolean;
};

type ResolvedValuation = {
  variantId: string;
  source: "database" | "soldcomps";
  low: number;
  central: number;
  high: number;
  confidence: number;
  compCount: number;
  demand: "Low" | "Medium" | "High";
};

type ListingValuation = Omit<ResolvedValuation, "variantId" | "source"> & {
  source: "soldcomps";
};

type PlaceCoordinates = { latitude: number; longitude: number };

type MatchedListing = {
  listing: MarketplaceListing;
  variant: RuntimeCatalogueVariant;
  identificationConfidence: number;
  preliminaryReference: number;
  preliminaryProfit: number;
};

export type DurableProductFinderResponse = {
  searchId: string;
  status: "pending" | "complete" | "partial" | "failed";
  stage: string;
  deals?: AppDeal[];
  message?: string;
};

type BrightDataRecord = {
  product_id?: string;
  url?: string;
  title?: string;
  initial_price?: number | string;
  final_price?: number | string;
  currency?: string;
  condition?: string;
  location?: string;
  country_code?: string;
  images?: string[];
  listing_date?: string;
  error?: string;
  error_code?: string;
  input?: { url?: string };
};

type BrightDataSnapshotResponse = BrightDataRecord[] | { status?: string; snapshot_id?: string; error?: string; message?: string };

type SoldCompsItem = {
  itemId?: string;
  url?: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  fullResThumbnailUrl?: string | null;
  condition?: string | null;
  soldPrice?: string | null;
  currentPrice?: string | null;
  soldCurrency?: string | null;
  currentCurrency?: string | null;
  shippingPrice?: string | null;
  totalPrice?: string | null;
  itemLocation?: string | null;
  endedAt?: string | null;
  scrapedAt?: string;
  bestOfferAccepted?: boolean;
};

type SoldCompsResponse = {
  items?: SoldCompsItem[];
  error?: string;
  message?: string;
};

export class ProductFinderProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "ProductFinderProviderError";
  }
}

export function getProductFinderConfiguration() {
  return {
    brightData: Boolean(process.env.BRIGHT_DATA_API_KEY),
    soldComps: Boolean(process.env.SOLD_COMPS_API_KEY),
    database: getRuntimeConfiguration(),
  };
}

export async function findProductDeals(input: ProductFinderInput): Promise<AppDeal[]> {
  const keyword = input.query.trim() || input.category.trim();
  if (!keyword) throw new ProductFinderProviderError("Enter a product or choose a category.", 400);

  const soldCompsKey = process.env.SOLD_COMPS_API_KEY;
  if (!soldCompsKey) {
    throw new ProductFinderProviderError("SoldComps is not configured yet. Add SOLD_COMPS_API_KEY to .env.local.", 503);
  }

  const [listings, comps] = await Promise.all([
    input.source === "Facebook"
      ? discoverFacebookListings(keyword, input.location || "United Kingdom", input.radius)
      : discoverEbayListings(keyword, soldCompsKey),
    fetchSoldComps(keyword, soldCompsKey),
  ]);

  if (!listings.length) return [];
  if (!comps.length) {
    throw new ProductFinderProviderError("SoldComps returned no usable GBP sold listings for this search.", 502);
  }

  return rankListings(listings, comps, input);
}

export async function startFacebookProductFinderSearch(input: ProductFinderInput): Promise<{ snapshotId: string }> {
  const keyword = input.query.trim() || input.category.trim();
  if (!keyword) throw new ProductFinderProviderError("Enter a product or choose a category.", 400);

  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) {
    throw new ProductFinderProviderError("Bright Data is not configured yet. Add BRIGHT_DATA_API_KEY to .env.local.", 503);
  }

  const response = await providerFetch(buildBrightDataUrl(BRIGHT_DATA_TRIGGER_ENDPOINT, "keyword"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [{
        keyword,
        city: input.location || "United Kingdom",
        radius: Math.round(input.radius || 20),
        date_listed: "",
      }],
      limit_per_input: input.fullValidation ? 20 : 100,
    }),
  });
  const body = await readProviderJson<{ snapshot_id?: string; error?: string; message?: string }>(response);
  if (!response.ok || !body.snapshot_id) {
    throw new ProductFinderProviderError(readProviderError(body, "Bright Data could not start the Marketplace search."), response.status);
  }
  return { snapshotId: body.snapshot_id };
}

export async function startDurableFacebookProductFinderSearch(input: ProductFinderInput): Promise<DurableProductFinderResponse> {
  if (!getRuntimeConfiguration()) {
    throw new ProductFinderProviderError("Flipbot's database runtime is not configured.", 503);
  }
  const { snapshotId } = await startFacebookProductFinderSearch(input);
  const search = await createRuntimeSearch(input as unknown as Record<string, unknown>, snapshotId);
  return {
    searchId: search.id,
    status: "pending",
    stage: search.stage,
    message: "Facebook Marketplace is collecting up to 100 listings.",
  };
}

export async function advanceDurableFacebookProductFinderSearch(searchId: string): Promise<DurableProductFinderResponse> {
  const stored = await getRuntimeSearch(searchId);
  const search = stored.search;
  const input = search.request_payload as unknown as ProductFinderInput;

  if (search.status === "COMPLETE" || search.status === "PARTIAL") {
    return {
      searchId,
      status: search.status === "PARTIAL" ? "partial" : "complete",
      stage: "COMPLETE",
      deals: stored.results.map((row) => runtimeResultToDeal(row, input)),
      message: search.partial_reason || undefined,
    };
  }
  if (search.status === "FAILED") {
    return { searchId, status: "failed", stage: search.stage, message: search.error_message || "The search failed." };
  }
  if (!search.provider_snapshot_id) {
    throw new ProductFinderProviderError("Marketplace search reference is missing.", 500);
  }

  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) throw new ProductFinderProviderError("Bright Data is not configured.", 503);

  const progress = await getBrightDataProgress(search.provider_snapshot_id, apiKey);
  const providerStatus = progress.status.toLowerCase();
  if (providerStatus === "failed") {
    await updateRuntimeSearch(searchId, {
      status: "FAILED",
      stage: "FINDING_LISTINGS",
      provider_status: providerStatus,
      error_code: "MARKETPLACE_PROVIDER_FAILED",
      error_message: "Facebook Marketplace data is temporarily unavailable. Please try again shortly.",
    });
    return {
      searchId,
      status: "failed",
      stage: "FINDING_LISTINGS",
      message: "Facebook Marketplace data is temporarily unavailable. Please try again shortly.",
    };
  }
  if (providerStatus !== "ready") {
    await updateRuntimeSearch(searchId, { provider_status: providerStatus, stage: "FINDING_LISTINGS" });
    return {
      searchId,
      status: "pending",
      stage: "FINDING_LISTINGS",
      message: "Facebook Marketplace is still collecting listings.",
    };
  }

  await updateRuntimeSearch(searchId, { status: "PROCESSING", provider_status: "ready", stage: "ANALYSING_LISTINGS" });
  try {
    const snapshot = await getBrightDataSnapshot(search.provider_snapshot_id, apiKey);
    if (!Array.isArray(snapshot)) {
      throw new ProductFinderProviderError(readProviderError(snapshot, "Marketplace results were not ready to download."), 502);
    }
    const deals = await processMarketplaceSnapshot(searchId, input, snapshot);
    return deals;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flipbot could not process this Marketplace search.";
    await updateRuntimeSearch(searchId, {
      status: "FAILED",
      stage: "ANALYSING_LISTINGS",
      error_code: "PROCESSING_FAILED",
      error_message: message,
    });
    throw error;
  }
}

export async function revealRejectedShortlist(searchId: string): Promise<DurableProductFinderResponse> {
  const stored = await getRuntimeSearch(searchId);
  const search = stored.search;
  if (search.status !== "COMPLETE" && search.status !== "PARTIAL") {
    throw new ProductFinderProviderError("The Marketplace search must finish before its rejected shortlist can be previewed.", 409);
  }
  if (!search.provider_snapshot_id) {
    throw new ProductFinderProviderError("Marketplace search reference is missing.", 500);
  }

  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) throw new ProductFinderProviderError("Bright Data is not configured.", 503);
  const records = await getBrightDataSnapshot(search.provider_snapshot_id, apiKey);
  if (!Array.isArray(records)) {
    throw new ProductFinderProviderError("Marketplace listings are not ready to preview.", 409);
  }

  const input = search.request_payload as unknown as ProductFinderInput;
  const listings = deduplicateListings(brightDataRecordsToListings(records));
  const catalogue = await getRuntimeCatalogue(input.query.trim(), input.category, input.query.trim() ? 800 : 3000);
  const shortlist = listings
    .filter((listing) => !hasFaultLanguage(listing.title))
    .flatMap((listing): MatchedListing[] => {
      const match = matchCatalogueVariant(listing, catalogue);
      if (!match) return [];
      const preliminaryReference = currentDatabaseReference(match.variant) ||
        moneyFromMinor(match.variant.cex_sell_price_minor) ||
        moneyFromMinor(match.variant.marketplace_reference_minor);
      if (!preliminaryReference) return [];
      return [{
        listing,
        variant: match.variant,
        identificationConfidence: match.confidence,
        preliminaryReference,
        preliminaryProfit: preliminaryReference - listing.price,
      }];
    })
    .filter((candidate) => candidate.listing.price <= input.maximumBuyPrice)
    .sort((a, b) => preliminaryScore(b, input) - preliminaryScore(a, input))
    .slice(0, 10);
  const previewDeals = shortlist.map((candidate) => createPreliminaryPreviewDeal(candidate, input));
  const previewReason = "One-time preview: these shortlisted listings did not pass Flipbot's normal verified-deal filters.";

  await completeRuntimeSearch({
    searchId,
    status: search.status,
    metrics: {
      unseenAnalyzed: search.unseen_analyzed,
      duplicatesSkipped: search.duplicates_skipped,
      databaseMatches: search.database_matches,
      cacheHits: search.cache_hits,
      staleValuations: search.stale_valuations,
      liveValidations: search.live_validations,
      soldRecordsRetrieved: search.sold_records_retrieved,
      top10Qualifiers: search.top_10_qualifiers,
      marketplaceRecordsReceived: search.marketplace_records_received,
      cexUsed: search.cex_used,
      partialReason: previewReason,
      marketplaceCostMicros: search.marketplace_cost_micros,
      ebayCostMicros: search.ebay_cost_micros,
    },
    results: shortlist.map((candidate, index) => previewDealToRuntimeResult(previewDeals[index], candidate)),
  });

  return {
    searchId,
    status: search.status === "PARTIAL" ? "partial" : "complete",
    stage: "COMPLETE",
    deals: previewDeals,
    message: previewReason,
  };
}

export async function revealFullSearchAudit(searchId: string): Promise<DurableProductFinderResponse> {
  const stored = await getRuntimeSearch(searchId);
  const search = stored.search;
  if (search.status !== "COMPLETE" && search.status !== "PARTIAL") {
    throw new ProductFinderProviderError("The Marketplace search must finish before its rejection audit can be shown.", 409);
  }
  if (!search.provider_snapshot_id) throw new ProductFinderProviderError("Marketplace search reference is missing.", 500);
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) throw new ProductFinderProviderError("Bright Data is not configured.", 503);
  const snapshot = await getBrightDataSnapshot(search.provider_snapshot_id, apiKey);
  if (!Array.isArray(snapshot)) throw new ProductFinderProviderError("Marketplace listings are not ready to audit.", 409);

  const input = search.request_payload as unknown as ProductFinderInput;
  const records = snapshot.slice(0, 20);
  const locations = records.map((record) => record.location || "");
  const locationChecks = await locationsWithinRadius(locations, input.location || "United Kingdom", input.radius || 20);
  const auditDeals = records.map((record, index): AppDeal => {
    const price = toMoney(record.final_price ?? record.initial_price);
    const listing: MarketplaceListing = {
      id: record.product_id || stableId(record.url || record.input?.url || `${searchId}-${index}`),
      url: record.url || record.input?.url || "",
      title: record.title || `Unavailable Facebook listing ${index + 1}`,
      price,
      currency: record.currency || "",
      condition: record.condition || "Unknown",
      location: record.location || "Unavailable",
      image: record.images?.[0] || "/flipbot-placeholder.svg",
      listedAt: record.listing_date,
    };
    const reason = rejectionReasonForAudit(record, listing, input, locationChecks[index]);
    return {
      id: `facebook-${listing.id}`,
      title: listing.title,
      image: listing.image,
      listingUrl: listing.url || undefined,
      marketplace: "Facebook",
      category: input.category,
      location: listing.location,
      age: relativeAge(listing.listedAt),
      cost: Math.round(listing.price),
      resale: 0,
      fees: 0,
      profit: 0,
      roi: 0,
      risk: "High",
      rating: "Avoid",
      demand: "Not valued",
      rejectionReason: reason,
    };
  });
  const auditReason = `Rejection audit for all ${records.length} Bright Data returns. No additional SoldComps calls were made.`;
  await completeRuntimeSearch({
    searchId,
    status: search.status,
    metrics: {
      unseenAnalyzed: search.unseen_analyzed,
      duplicatesSkipped: search.duplicates_skipped,
      databaseMatches: search.database_matches,
      cacheHits: search.cache_hits,
      staleValuations: search.stale_valuations,
      liveValidations: search.live_validations,
      soldRecordsRetrieved: search.sold_records_retrieved,
      top10Qualifiers: search.top_10_qualifiers,
      marketplaceRecordsReceived: search.marketplace_records_received,
      cexUsed: search.cex_used,
      partialReason: auditReason,
      marketplaceCostMicros: search.marketplace_cost_micros,
      ebayCostMicros: search.ebay_cost_micros,
    },
    results: records.map((record, index) => auditDealToRuntimeResult(auditDeals[index], record, searchId, index)),
  });
  return {
    searchId,
    status: search.status === "PARTIAL" ? "partial" : "complete",
    stage: "COMPLETE",
    deals: auditDeals,
    message: auditReason,
  };
}

async function processMarketplaceSnapshot(
  searchId: string,
  input: ProductFinderInput,
  records: BrightDataRecord[],
): Promise<DurableProductFinderResponse> {
  const listings = deduplicateListings(brightDataRecordsToListings(records));
  if (input.fullValidation) {
    return processFullValidationSnapshot(searchId, input, records, listings);
  }
  const catalogue = await getRuntimeCatalogue(input.query.trim(), input.category, input.query.trim() ? 800 : 3000);
  const matched = listings
    .filter((listing) => !hasFaultLanguage(listing.title))
    .flatMap((listing): MatchedListing[] => {
      const match = matchCatalogueVariant(listing, catalogue);
      if (!match) return [];
      const preliminaryReference = currentDatabaseReference(match.variant) ||
        moneyFromMinor(match.variant.cex_sell_price_minor) ||
        moneyFromMinor(match.variant.marketplace_reference_minor);
      if (!preliminaryReference) return [];
      return [{
        listing,
        variant: match.variant,
        identificationConfidence: match.confidence,
        preliminaryReference,
        preliminaryProfit: preliminaryReference - listing.price,
      }];
    })
    .filter((candidate) => candidate.listing.price <= input.maximumBuyPrice)
    .sort((a, b) => preliminaryScore(b, input) - preliminaryScore(a, input))
    .slice(0, 10);

  await updateRuntimeSearch(searchId, {
    stage: "CHECKING_MARKET_VALUES",
    marketplace_records_received: listings.length,
  });

  const metrics = {
    unseenAnalyzed: listings.length,
    duplicatesSkipped: Math.max(0, records.length - listings.length),
    databaseMatches: 0,
    cacheHits: 0,
    staleValuations: 0,
    liveValidations: 0,
    soldRecordsRetrieved: 0,
    top10Qualifiers: matched.length,
    marketplaceRecordsReceived: listings.length,
    cexUsed: matched.some((candidate) => Boolean(candidate.variant.cex_sell_price_minor)),
    partialReason: listings.length < 100 ? `Bright Data returned ${listings.length} usable listings from the 100-listing target.` : "",
    marketplaceCostMicros: listings.length * 1_185,
    ebayCostMicros: 0,
  };

  const valuationPromises = new Map<string, Promise<ResolvedValuation | null>>();
  const liveValuationVariantIds = new Set(
    [...new Map(matched.map((candidate) => [candidate.variant.variant_id, candidate.variant])).values()]
      .filter((variant) => !hasFreshDatabaseValuation(variant))
      // SoldComps currently returns a 40-record page even when a lower count
      // is requested. One live page keeps a 100-listing search below £0.30.
      .slice(0, 1)
      .map((variant) => variant.variant_id),
  );
  const resolved = await mapWithConcurrency(matched, 2, async (candidate) => {
    let valuationPromise = valuationPromises.get(candidate.variant.variant_id);
    if (!valuationPromise) {
      valuationPromise = resolveCandidateValuation(candidate.variant, metrics, liveValuationVariantIds);
      valuationPromises.set(candidate.variant.variant_id, valuationPromise);
    } else {
      metrics.cacheHits += 1;
    }
    return { candidate, valuation: await valuationPromise };
  });

  await updateRuntimeSearch(searchId, { stage: "RANKING_DEALS" });
  const ranked = resolved.flatMap(({ candidate, valuation }) => {
    if (!valuation) return [];
    const deal = createVerifiedDeal(candidate, valuation, input);
    return deal ? [{ deal, candidate, valuation }] : [];
  }).sort((a, b) => scoreDeal(b.deal) - scoreDeal(a.deal)).slice(0, 5);

  const status = listings.length < 100 ? "PARTIAL" : "COMPLETE";
  const results = ranked.map(({ deal, candidate, valuation }) => dealToRuntimeResult(deal, candidate, valuation));
  await completeRuntimeSearch({ searchId, status, metrics, results });

  return {
    searchId,
    status: status === "PARTIAL" ? "partial" : "complete",
    stage: "COMPLETE",
    deals: ranked.map(({ deal }) => deal),
    message: metrics.partialReason || undefined,
  };
}

async function processFullValidationSnapshot(
  searchId: string,
  input: ProductFinderInput,
  records: BrightDataRecord[],
  listings: MarketplaceListing[],
): Promise<DurableProductFinderResponse> {
  const soldCompsKey = process.env.SOLD_COMPS_API_KEY;
  if (!soldCompsKey) throw new ProductFinderProviderError("SoldComps is not configured.", 503);

  await updateRuntimeSearch(searchId, {
    stage: "CHECKING_SEARCH_CRITERIA",
    marketplace_records_received: listings.length,
  });

  const locationChecks = await locationsWithinRadius(
    listings.map((listing) => listing.location),
    input.location || "United Kingdom",
    input.radius || 20,
  );
  const eligibleListings = listings.filter((listing, index) => {
    return locationChecks[index] && listingMatchesSearchCriteria(listing, input);
  });

  await updateRuntimeSearch(searchId, {
    stage: "VALIDATING_EVERY_ELIGIBLE_LISTING",
  });

  let soldRecordsRetrieved = 0;
  let completedLookups = 0;
  const validations = await mapWithConcurrency(eligibleListings, 4, async (listing) => {
    let fetched: SoldComp[] = [];
    try {
      fetched = await retrySoldComps(() => fetchSoldComps(listing.title, soldCompsKey));
    } catch {
      // A failed provider lookup is retained as an unverified listing so the
      // full sweep can continue across every other Marketplace return.
    }
    soldRecordsRetrieved += fetched.length;
    completedLookups += 1;
    if (completedLookups % 5 === 0 || completedLookups === eligibleListings.length) {
      await updateRuntimeSearch(searchId, {
        stage: `VALIDATING_ELIGIBLE_LISTINGS_${completedLookups}_OF_${eligibleListings.length}`,
        sold_records_retrieved: soldRecordsRetrieved,
        live_validations: completedLookups,
      });
    }

    const valid = fetched
      .map((comp) => ({ comp, similarity: titleSimilarity(listing.title, comp.title) }))
      .filter(({ comp, similarity }) => similarity >= 0.45 && matchingValueNumbers(listing.title, comp.title))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
    if (valid.length < 3) return { listing, valuation: null as ListingValuation | null };
    const prices = valid.map(({ comp }) => comp.price).sort((a, b) => a - b);
    return {
      listing,
      valuation: {
        source: "soldcomps" as const,
        low: percentile(prices, 0.2),
        central: median(prices),
        high: percentile(prices, 0.8),
        confidence: valid.length >= 5 ? 0.85 : 0.7,
        compCount: valid.length,
        demand: demandFromCount(fetched.length),
      },
    };
  });

  const ranked = validations.flatMap(({ listing, valuation }) => {
    if (!valuation) return [];
    const deal = createFullValidationDeal(listing, valuation, input);
    return deal ? [{ deal, listing, valuation }] : [];
  }).sort((a, b) => scoreDeal(b.deal) - scoreDeal(a.deal)).slice(0, 5);

  const failedLookups = validations.filter(({ valuation }) => !valuation).length;
  const reasons = [
    listings.length < 20 ? `Bright Data returned ${listings.length} usable listings from the 20-listing test target.` : "",
    `${eligibleListings.length} listings passed the product, price, city and ${input.radius || 20}-mile radius checks and were sent to SoldComps.`,
    `${listings.length - eligibleListings.length} listings were rejected before valuation because they did not meet those search criteria.`,
    `${failedLookups} eligible listings did not produce three sufficiently matching sold comparables.`,
  ].filter(Boolean);
  const status = listings.length < 20 || failedLookups > 0 ? "PARTIAL" : "COMPLETE";
  const metrics = {
    unseenAnalyzed: listings.length,
    duplicatesSkipped: Math.max(0, records.length - listings.length),
    databaseMatches: 0,
    cacheHits: 0,
    staleValuations: 0,
    liveValidations: eligibleListings.length,
    soldRecordsRetrieved,
    top10Qualifiers: Math.min(10, validations.filter(({ valuation }) => valuation).length),
    marketplaceRecordsReceived: listings.length,
    cexUsed: false,
    partialReason: reasons.join(" "),
    marketplaceCostMicros: listings.length * 1_185,
    ebayCostMicros: soldRecordsRetrieved * 2_765,
  };
  await completeRuntimeSearch({
    searchId,
    status,
    metrics,
    results: ranked.map(({ deal, listing, valuation }) => fullValidationDealToRuntimeResult(deal, listing, valuation)),
  });

  return {
    searchId,
    status: status === "PARTIAL" ? "partial" : "complete",
    stage: "COMPLETE",
    deals: ranked.map(({ deal }) => deal),
    message: metrics.partialReason,
  };
}

async function resolveCandidateValuation(
  variant: RuntimeCatalogueVariant,
  metrics: {
    databaseMatches: number;
    staleValuations: number;
    liveValidations: number;
    soldRecordsRetrieved: number;
    ebayCostMicros: number;
  },
  liveValuationVariantIds: Set<string>,
): Promise<ResolvedValuation | null> {
  if (
    variant.valuation_central_minor &&
    variant.valuation_low_minor &&
    variant.valuation_high_minor &&
    variant.cache_valid_until &&
    Date.parse(variant.cache_valid_until) > Date.now() &&
    Number(variant.valuation_confidence || 0) >= 0.6
  ) {
    metrics.databaseMatches += 1;
    return {
      variantId: variant.variant_id,
      source: "database",
      low: moneyFromMinor(variant.valuation_low_minor),
      central: moneyFromMinor(variant.valuation_central_minor),
      high: moneyFromMinor(variant.valuation_high_minor),
      confidence: Number(variant.valuation_confidence),
      compCount: Number(variant.valuation_comp_count || 0),
      demand: demandFromCount(Number(variant.valuation_comp_count || 0)),
    };
  }
  if (variant.valuation_central_minor) metrics.staleValuations += 1;
  if (!liveValuationVariantIds.has(variant.variant_id)) return null;

  const soldCompsKey = process.env.SOLD_COMPS_API_KEY;
  if (!soldCompsKey) throw new ProductFinderProviderError("SoldComps is not configured.", 503);
  let fetched: SoldComp[];
  try {
    fetched = await retrySoldComps(() => fetchSoldComps(variant.canonical_name, soldCompsKey));
  } catch {
    return null;
  }
  metrics.soldRecordsRetrieved += fetched.length;
  metrics.ebayCostMicros += fetched.length * 2_765;
  const valid = fetched
    .map((comp) => ({ comp, similarity: titleSimilarity(variant.canonical_name, comp.title) }))
    .filter(({ comp, similarity }) => similarity >= 0.55 && matchingValueNumbers(variant.canonical_name, comp.title))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
  if (valid.length < 3) return null;

  const prices = valid.map(({ comp }) => comp.price).sort((a, b) => a - b);
  const central = median(prices);
  const low = percentile(prices, 0.2);
  const high = percentile(prices, 0.8);
  const confidence = valid.length >= 5 ? 0.85 : 0.7;
  metrics.liveValidations += 1;

  await storeRuntimeValuation({
    variantId: variant.variant_id,
    lowMinor: Math.round(low * 100),
    centralMinor: Math.round(central * 100),
    highMinor: Math.round(high * 100),
    relevantSales30d: fetched.length,
    comps: valid.map(({ comp, similarity }) => ({
      itemId: comp.itemId,
      title: comp.title,
      priceMinor: Math.round(comp.price * 100),
      shippingMinor: Math.round(comp.shipping * 100),
      currency: comp.currency,
      endedAt: comp.endedAt,
      url: comp.url,
      matchQuality: similarity,
    })),
  });

  return {
    variantId: variant.variant_id,
    source: "soldcomps",
    low,
    central,
    high,
    confidence,
    compCount: valid.length,
    demand: demandFromCount(fetched.length),
  };
}

export async function finishFacebookProductFinderSearch(input: ProductFinderInput, snapshotId: string): Promise<AppDeal[] | null> {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const soldCompsKey = process.env.SOLD_COMPS_API_KEY;
  if (!apiKey) throw new ProductFinderProviderError("Bright Data is not configured yet. Add BRIGHT_DATA_API_KEY to .env.local.", 503);
  if (!soldCompsKey) throw new ProductFinderProviderError("SoldComps is not configured yet. Add SOLD_COMPS_API_KEY to .env.local.", 503);

  const body = await getBrightDataSnapshot(snapshotId, apiKey);
  if (!Array.isArray(body)) {
    if (body.status === "failed") {
      throw new ProductFinderProviderError(readProviderError(body, "Bright Data could not finish the Marketplace search."), 502);
    }
    return null;
  }

  const keyword = input.query.trim() || input.category.trim();
  const listings = brightDataRecordsToListings(body);
  const comps = await fetchSoldComps(keyword, soldCompsKey);
  if (!comps.length) {
    throw new ProductFinderProviderError("SoldComps returned no usable GBP sold listings for this search.", 502);
  }
  return rankListings(listings, comps, input);
}

function rankListings(listings: MarketplaceListing[], comps: SoldComp[], input: ProductFinderInput): AppDeal[] {
  return listings
    .map((listing) => createDeal(listing, comps, input))
    .filter((deal): deal is AppDeal => Boolean(deal))
    .sort((a, b) => scoreDeal(b) - scoreDeal(a))
    .slice(0, 5);
}

async function discoverFacebookListings(keyword: string, city: string, radius?: number): Promise<MarketplaceListing[]> {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) {
    throw new ProductFinderProviderError("Bright Data is not configured yet. Add BRIGHT_DATA_API_KEY to .env.local.", 503);
  }

  const url = buildBrightDataUrl(BRIGHT_DATA_ENDPOINT);
  url.searchParams.set("format", "json");

  const request = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [{ keyword, city, radius, date_listed: "" }],
      limit_per_input: 20,
    }),
  };
  let response = await providerFetch(url, request);
  let body = await readProviderJson<BrightDataSnapshotResponse>(response);
  for (const delay of PROVIDER_RETRY_DELAYS_MS) {
    if (response.ok || !isRetryableProviderResponse(response.status, body)) break;
    await sleep(delay);
    response = await providerFetch(url, request);
    body = await readProviderJson<BrightDataSnapshotResponse>(response);
  }
  if (!response.ok) {
    throw new ProductFinderProviderError(readProviderError(body, "Bright Data could not search Marketplace."), response.status);
  }
  if (!Array.isArray(body) && body.snapshot_id) {
    body = await waitForBrightDataSnapshot(body.snapshot_id, apiKey);
  }
  if (!Array.isArray(body)) {
    throw new ProductFinderProviderError(readProviderError(body, "Bright Data returned an unexpected response."));
  }

  return brightDataRecordsToListings(body);
}

function brightDataRecordsToListings(records: BrightDataRecord[]): MarketplaceListing[] {
  return records.flatMap((record): MarketplaceListing[] => {
    const price = toMoney(record.final_price ?? record.initial_price);
    if (!record.title || !record.url || !price || record.error) return [];
    return [{
      id: record.product_id || stableId(record.url),
      url: record.url,
      title: record.title,
      price,
      currency: record.currency || "",
      condition: record.condition || "Unknown",
      location: record.location || record.country_code || "Unknown",
      image: record.images?.[0] || "/flipbot-placeholder.svg",
      listedAt: record.listing_date,
    }];
  });
}

async function waitForBrightDataSnapshot(snapshotId: string, apiKey: string): Promise<BrightDataRecord[]> {
  for (let attempt = 0; attempt < SNAPSHOT_MAX_POLLS; attempt += 1) {
    const body = await getBrightDataSnapshot(snapshotId, apiKey);
    if (Array.isArray(body)) return body;
    if (body.status === "failed") {
      throw new ProductFinderProviderError(readProviderError(body, "Bright Data could not finish the Marketplace search."), 502);
    }
    await sleep(SNAPSHOT_POLL_INTERVAL_MS);
  }

  throw new ProductFinderProviderError("Marketplace listings are still being prepared by Bright Data. Try a more specific product/location or run the search again shortly.", 504);
}

async function getBrightDataSnapshot(snapshotId: string, apiKey: string): Promise<BrightDataSnapshotResponse> {
  const snapshotUrl = new URL(`https://api.brightdata.com/datasets/v3/snapshot/${encodeURIComponent(snapshotId)}`);
  snapshotUrl.searchParams.set("format", "json");
  const response = await providerFetch(snapshotUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await readProviderJson<BrightDataSnapshotResponse>(response);
  if (!response.ok) {
    throw new ProductFinderProviderError(readProviderError(body, "Bright Data could not read the Marketplace search."), response.status);
  }
  return body;
}

async function getBrightDataProgress(snapshotId: string, apiKey: string): Promise<{ status: string }> {
  const progressUrl = new URL(`${BRIGHT_DATA_PROGRESS_ENDPOINT}/${encodeURIComponent(snapshotId)}`);
  const response = await providerFetch(progressUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await readProviderJson<{ status?: string; message?: string; error?: string }>(response);
  if (!response.ok) {
    throw new ProductFinderProviderError(readProviderError(body, "Bright Data could not read Marketplace progress."), response.status);
  }
  return { status: body.status || "running" };
}

function buildBrightDataUrl(endpoint: string, discoverBy: "keyword" | "url" = "keyword") {
  const datasetId = process.env.BRIGHT_DATA_FACEBOOK_MARKETPLACE_DATASET_ID || DEFAULT_MARKETPLACE_DATASET;
  const url = new URL(endpoint);
  url.searchParams.set("dataset_id", datasetId);
  url.searchParams.set("notify", "false");
  url.searchParams.set("include_errors", "true");
  url.searchParams.set("type", "discover_new");
  url.searchParams.set("discover_by", discoverBy);
  return url;
}

async function discoverEbayListings(keyword: string, apiKey: string): Promise<MarketplaceListing[]> {
  const response = await requestSoldComps(keyword, apiKey, false);
  return (response.items || []).flatMap((item): MarketplaceListing[] => {
    const price = toMoney(item.currentPrice ?? item.totalPrice);
    if (!item.title || !item.url || !item.itemId || !price) return [];
    return [{
      id: item.itemId,
      url: item.url,
      title: item.title,
      price,
      currency: item.currentCurrency || "GBP",
      condition: item.condition || "Unknown",
      location: item.itemLocation || "UK",
      image: item.fullResThumbnailUrl || item.thumbnailUrl || "/flipbot-placeholder.svg",
      listedAt: item.scrapedAt,
    }];
  });
}

async function fetchSoldComps(keyword: string, apiKey: string): Promise<SoldComp[]> {
  const response = await requestSoldComps(keyword, apiKey, true);
  return (response.items || []).flatMap((item): SoldComp[] => {
    const price = toMoney(item.totalPrice ?? item.soldPrice);
    const currency = item.soldCurrency || "GBP";
    if (!item.itemId || !item.title || !price || currency !== "GBP") return [];
    return [{
      itemId: item.itemId,
      url: item.url || undefined,
      title: item.title,
      price,
      shipping: toMoney(item.shippingPrice),
      currency,
      condition: item.condition || "Unknown",
      endedAt: item.endedAt || undefined,
      bestOfferAccepted: Boolean(item.bestOfferAccepted),
    }];
  });
}

async function requestSoldComps(keyword: string, apiKey: string, sold: boolean): Promise<SoldCompsResponse> {
  const url = new URL(SOLD_COMPS_ENDPOINT);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("ebaySite", "ebay.co.uk");
  url.searchParams.set("page", "1");
  url.searchParams.set("count", sold ? "12" : "100");
  url.searchParams.set("sortOrder", sold ? "endedRecently" : "timeNewlyListed");
  url.searchParams.set("itemLocation", "domestic");
  url.searchParams.set("itemCondition", "used");
  url.searchParams.set("exactMatch", "true");
  if (!sold) url.searchParams.set("sold", "false");

  const response = await providerFetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await readProviderJson<SoldCompsResponse>(response);
  if (!response.ok) {
    throw new ProductFinderProviderError(readProviderError(body, "SoldComps could not retrieve eBay data."), response.status);
  }
  return body;
}

function createDeal(listing: MarketplaceListing, comps: SoldComp[], input: ProductFinderInput): AppDeal | null {
  if (listing.currency && listing.currency !== "GBP") return null;
  if (listing.price > input.maximumBuyPrice) return null;
  if (input.query.trim() && !matchesRequestedProduct(input.query, listing.title)) return null;

  const ranked = comps
    .map((comp) => ({ comp, similarity: titleSimilarity(listing.title, comp.title) }))
    .filter(({ similarity }) => similarity >= 0.28)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 30);
  if (ranked.length < 3) return null;

  const resale = Math.round(median(ranked.map(({ comp }) => comp.price)));
  const fees = Math.round(resale * 0.13 + 3);
  const profit = resale - listing.price - fees;
  if (profit < input.minimumProfit) return null;

  const roi = Math.round((profit / listing.price) * 100);
  const averageSimilarity = ranked.reduce((sum, match) => sum + match.similarity, 0) / ranked.length;
  const risk: AppDeal["risk"] = averageSimilarity >= 0.58 && ranked.length >= 10 ? "Low" : averageSimilarity >= 0.4 && ranked.length >= 5 ? "Medium" : "High";
  const rating: AppDeal["rating"] = profit >= 80 && roi >= 30 ? "Exceptional Buy" : profit >= 40 && roi >= 20 ? "Strong Buy" : profit >= 20 && roi >= 10 ? "Possible Buy" : "Risky";

  return {
    id: `${input.source.toLowerCase()}-${listing.id}`,
    title: listing.title,
    image: listing.image,
    listingUrl: listing.url,
    marketplace: input.source,
    category: input.category,
    location: listing.location,
    age: relativeAge(listing.listedAt),
    cost: Math.round(listing.price),
    resale,
    fees,
    profit: Math.round(profit),
    roi,
    risk,
    rating,
    demand: ranked.length >= 20 ? "High" : ranked.length >= 8 ? "Medium" : "Low",
  };
}

function rejectionReasonForAudit(
  record: BrightDataRecord,
  listing: MarketplaceListing,
  input: ProductFinderInput,
  isWithinRadius: boolean,
) {
  if (record.error) return `Bright Data could not read this listing: ${record.error}`;
  if (!record.title || !listing.url) return "Bright Data returned an incomplete listing without a usable title or URL.";
  if (record.country_code && !/^(GB|UK)$/i.test(record.country_code)) {
    return `Wrong country: ${listing.location} (${record.country_code}). The search required ${input.location || "the selected UK city"}.`;
  }
  if (listing.currency && listing.currency !== "GBP") return `Wrong currency: ${listing.currency}. The search required a UK/GBP listing.`;
  if (listing.price <= 0) return "No genuine positive purchase price was supplied.";
  if (listing.price > input.maximumBuyPrice) return `Over budget: £${Math.round(listing.price)} exceeds the £${input.maximumBuyPrice} maximum.`;
  if (hasFaultLanguage(listing.title)) return "The title indicates parts, damage, repairs, a wanted ad or another excluded condition.";
  if (/\b(case|cover|screen protector|charger|charging cable|empty box|box only|dummy|replica)\b/i.test(listing.title)) return "Accessory-only or non-product listing.";
  if (input.query.trim() && !matchesRequestedProduct(input.query, listing.title)) return `The title does not match the requested product “${input.query}”.`;
  if (!input.query.trim() && !matchesCategoryTitle(input.category, listing.title)) return `The title does not match the ${input.category} category closely enough.`;
  if (!isWithinRadius) return `Outside the ${input.radius || 20}-mile radius around ${input.location || "the selected city"}, or the location could not be verified.`;
  return "It passed the initial criteria but did not produce a qualifying verified deal after SoldComps, profit and ROI checks.";
}

function auditDealToRuntimeResult(deal: AppDeal, record: BrightDataRecord, searchId: string, index: number) {
  const marketplaceListingId = record.product_id || stableId(record.url || record.input?.url || `${searchId}-${index}`);
  return {
    marketplaceListingId,
    productVariantId: "",
    askingPriceMinor: Math.max(0, Math.round(deal.cost * 100)),
    resaleLowMinor: "",
    resaleCentralMinor: "",
    resaleHighMinor: "",
    currency: record.currency || "GBP",
    estimatedProfitMinor: 0,
    roi: 0,
    profitScore: 0,
    roiScore: 0,
    demandScore: 0,
    valuationConfidenceScore: 0,
    flipScore: 0,
    classification: null,
    hardFilterPassed: false,
    extrasNotes: "20-listing rejection audit",
    verificationNotes: deal.rejectionReason,
    listingUrl: deal.listingUrl || record.input?.url || "",
    listingTitle: deal.title,
    imageUrl: deal.image,
    locationLabel: deal.location,
    conditionLabel: record.condition || "Unknown",
    demand: "Not valued",
    valuationSource: "rejection_audit",
    compCount: 0,
  };
}

function createFullValidationDeal(listing: MarketplaceListing, valuation: ListingValuation, input: ProductFinderInput): AppDeal | null {
  if (listing.currency && listing.currency !== "GBP") return null;
  if (listing.price > input.maximumBuyPrice) return null;
  if (input.query.trim() && !matchesRequestedProduct(input.query, listing.title)) return null;
  const resale = Math.round(valuation.central);
  const profit = resale - listing.price;
  const roi = listing.price > 0 ? Math.round((profit / listing.price) * 100) : 0;
  const requiredProfit = Math.max(input.minimumProfit, requiredProfitFor(listing.price));
  if (profit < requiredProfit || roi < 20) return null;
  const rating: AppDeal["rating"] = profit >= 80 && roi >= 30 ? "Exceptional Buy" : profit >= 40 && roi >= 20 ? "Strong Buy" : "Possible Buy";
  return {
    id: `facebook-${listing.id}`,
    title: listing.title,
    image: listing.image,
    listingUrl: listing.url,
    marketplace: "Facebook",
    category: input.category,
    location: listing.location,
    age: relativeAge(listing.listedAt),
    cost: Math.round(listing.price),
    resale,
    fees: 0,
    profit: Math.round(profit),
    roi,
    risk: valuation.confidence >= 0.8 ? "Low" : "Medium",
    rating,
    demand: valuation.demand,
  };
}

function fullValidationDealToRuntimeResult(deal: AppDeal, listing: MarketplaceListing, valuation: ListingValuation) {
  const requiredProfit = requiredProfitFor(deal.cost);
  const profitScore = deal.profit >= requiredProfit * 1.8 ? 40 : deal.profit >= requiredProfit * 1.3 ? 30 : 20;
  const roiScore = deal.roi >= 60 ? 30 : deal.roi >= 50 ? 27 : deal.roi >= 40 ? 24 : deal.roi >= 30 ? 20 : 15;
  const demandScore = valuation.demand === "High" ? 15 : valuation.demand === "Medium" ? 10 : 5;
  const valuationConfidenceScore = valuation.confidence >= 0.8 ? 15 : 10;
  const flipScore = profitScore + roiScore + demandScore + valuationConfidenceScore;
  return {
    marketplaceListingId: listing.id,
    productVariantId: "",
    askingPriceMinor: Math.round(listing.price * 100),
    resaleLowMinor: Math.round(valuation.low * 100),
    resaleCentralMinor: Math.round(valuation.central * 100),
    resaleHighMinor: Math.round(valuation.high * 100),
    currency: "GBP",
    estimatedProfitMinor: Math.round(deal.profit * 100),
    roi: deal.roi,
    profitScore,
    roiScore,
    demandScore,
    valuationConfidenceScore,
    flipScore,
    classification: flipScore >= 80 ? "Exceptional Flip" : flipScore >= 60 ? "Good Flip" : "Risky Flip",
    hardFilterPassed: true,
    extrasNotes: "One-search full SoldComps validation",
    verificationNotes: `${valuation.compCount} closely matched SoldComps sales checked for this exact Marketplace listing`,
    listingUrl: listing.url,
    listingTitle: listing.title,
    imageUrl: listing.image,
    locationLabel: listing.location,
    conditionLabel: listing.condition,
    demand: valuation.demand,
    valuationSource: "soldcomps",
    compCount: valuation.compCount,
  };
}

function createPreliminaryPreviewDeal(candidate: MatchedListing, input: ProductFinderInput): AppDeal {
  const cost = candidate.listing.price;
  const resale = Math.round(candidate.preliminaryReference);
  const profit = resale - cost;
  const roi = cost > 0 ? Math.round((profit / cost) * 100) : 0;
  const requiredProfit = Math.max(input.minimumProfit, requiredProfitFor(cost));
  return {
    id: `facebook-${candidate.listing.id}`,
    title: `Preview — ${candidate.listing.title}`,
    image: candidate.listing.image,
    listingUrl: candidate.listing.url,
    marketplace: "Facebook",
    category: input.category,
    location: candidate.listing.location,
    age: relativeAge(candidate.listing.listedAt),
    cost: Math.round(cost),
    resale,
    fees: 0,
    profit: Math.round(profit),
    roi,
    risk: "High",
    rating: profit >= requiredProfit && roi >= 20 ? "Possible Buy" : "Avoid",
    demand: "Low",
  };
}

function previewDealToRuntimeResult(deal: AppDeal, candidate: MatchedListing) {
  const centralMinor = Math.round(candidate.preliminaryReference * 100);
  return {
    marketplaceListingId: candidate.listing.id,
    productVariantId: candidate.variant.variant_id,
    askingPriceMinor: Math.round(candidate.listing.price * 100),
    resaleLowMinor: Math.round(centralMinor * 0.9),
    resaleCentralMinor: centralMinor,
    resaleHighMinor: Math.round(centralMinor * 1.1),
    currency: "GBP",
    estimatedProfitMinor: Math.round(deal.profit * 100),
    roi: deal.roi,
    profitScore: 0,
    roiScore: 0,
    demandScore: 0,
    valuationConfidenceScore: 0,
    flipScore: 0,
    classification: null,
    hardFilterPassed: false,
    extrasNotes: "One-time rejected-shortlist preview",
    verificationNotes: `${candidate.variant.canonical_name} · indicative catalogue reference only`,
    listingUrl: candidate.listing.url,
    listingTitle: deal.title,
    imageUrl: candidate.listing.image,
    locationLabel: candidate.listing.location,
    conditionLabel: candidate.listing.condition,
    demand: "Low",
    valuationSource: "catalogue_reference",
    compCount: 0,
  };
}

function createVerifiedDeal(candidate: MatchedListing, valuation: ResolvedValuation, input: ProductFinderInput): AppDeal | null {
  const cost = candidate.listing.price;
  const resale = Math.round(valuation.central);
  const profit = resale - cost;
  const roi = Math.round((profit / cost) * 100);
  const requiredProfit = Math.max(input.minimumProfit, requiredProfitFor(cost));
  if (profit < requiredProfit || roi < 20) return null;

  const profitPoints = profit >= requiredProfit * 1.8 ? 40 : profit >= requiredProfit * 1.3 ? 30 : 20;
  const roiPoints = roi >= 60 ? 30 : roi >= 50 ? 27 : roi >= 40 ? 24 : roi >= 30 ? 20 : 15;
  const demandPoints = valuation.demand === "High" ? 15 : valuation.demand === "Medium" ? 10 : 5;
  const confidencePoints = valuation.confidence >= 0.8 ? 15 : valuation.confidence >= 0.65 ? 10 : 5;
  const flipScore = profitPoints + roiPoints + demandPoints + confidencePoints;
  const rating: AppDeal["rating"] = flipScore >= 80 ? "Exceptional Buy" : flipScore >= 60 ? "Strong Buy" : "Possible Buy";
  const risk: AppDeal["risk"] = valuation.confidence >= 0.8 ? "Low" : valuation.confidence >= 0.65 ? "Medium" : "High";

  return {
    id: `facebook-${candidate.listing.id}`,
    title: candidate.listing.title,
    image: candidate.listing.image,
    listingUrl: candidate.listing.url,
    marketplace: "Facebook",
    category: input.category,
    location: candidate.listing.location,
    age: relativeAge(candidate.listing.listedAt),
    cost: Math.round(cost),
    resale,
    fees: 0,
    profit: Math.round(profit),
    roi,
    risk,
    rating,
    demand: valuation.demand,
  };
}

function dealToRuntimeResult(deal: AppDeal, candidate: MatchedListing, valuation: ResolvedValuation) {
  const requiredProfit = requiredProfitFor(deal.cost);
  const profitScore = deal.profit >= requiredProfit * 1.8 ? 40 : deal.profit >= requiredProfit * 1.3 ? 30 : 20;
  const roiScore = deal.roi >= 60 ? 30 : deal.roi >= 50 ? 27 : deal.roi >= 40 ? 24 : deal.roi >= 30 ? 20 : 15;
  const demandScore = valuation.demand === "High" ? 15 : valuation.demand === "Medium" ? 10 : 5;
  const valuationConfidenceScore = valuation.confidence >= 0.8 ? 15 : valuation.confidence >= 0.65 ? 10 : 5;
  const flipScore = profitScore + roiScore + demandScore + valuationConfidenceScore;
  const classification = flipScore >= 80 ? "Exceptional Flip" : flipScore >= 60 ? "Good Flip" : "Risky Flip";
  return {
    marketplaceListingId: candidate.listing.id,
    productVariantId: valuation.variantId,
    askingPriceMinor: Math.round(candidate.listing.price * 100),
    resaleLowMinor: Math.round(valuation.low * 100),
    resaleCentralMinor: Math.round(valuation.central * 100),
    resaleHighMinor: Math.round(valuation.high * 100),
    currency: "GBP",
    estimatedProfitMinor: Math.round(deal.profit * 100),
    roi: deal.roi,
    profitScore,
    roiScore,
    demandScore,
    valuationConfidenceScore,
    flipScore,
    classification,
    hardFilterPassed: true,
    extrasNotes: "",
    verificationNotes: `${candidate.variant.canonical_name} · ${valuation.compCount} verified sold comparables`,
    listingUrl: candidate.listing.url,
    listingTitle: candidate.listing.title,
    imageUrl: candidate.listing.image,
    locationLabel: candidate.listing.location,
    conditionLabel: candidate.listing.condition,
    demand: valuation.demand,
    valuationSource: valuation.source,
    compCount: valuation.compCount,
  };
}

function runtimeResultToDeal(row: RuntimeSearchResult, input: ProductFinderInput): AppDeal {
  const numberValue = (key: string) => Number(row[key] ?? 0);
  const textValue = (key: string) => typeof row[key] === "string" ? row[key] as string : "";
  const flipScore = numberValue("flip_score");
  const confidenceScore = numberValue("valuation_confidence_score");
  const rejected = row.hard_filter_passed === false;
  return {
    id: `facebook-${textValue("marketplace_listing_id")}`,
    title: textValue("listing_title") || "Marketplace listing",
    image: textValue("image_url") || "/flipbot-placeholder.svg",
    listingUrl: textValue("listing_url") || undefined,
    marketplace: "Facebook",
    category: input.category,
    location: textValue("location_label") || "Unknown",
    age: "Recently",
    cost: Math.round(numberValue("asking_price_minor") / 100),
    resale: Math.round(numberValue("resale_central_minor") / 100),
    fees: 0,
    profit: Math.round(numberValue("estimated_profit_minor") / 100),
    roi: Math.round(numberValue("roi")),
    risk: confidenceScore >= 15 ? "Low" : confidenceScore >= 10 ? "Medium" : "High",
    rating: rejected ? "Avoid" : flipScore >= 80 ? "Exceptional Buy" : flipScore >= 60 ? "Strong Buy" : "Possible Buy",
    demand: textValue("demand") || "Unknown",
    rejectionReason: rejected ? textValue("verification_notes") || "Rejected by the search criteria." : undefined,
  };
}

function matchCatalogueVariant(listing: MarketplaceListing, catalogue: RuntimeCatalogueVariant[]) {
  const listingTokens = normaliseTokens(listing.title);
  const listingNumbers = valueNumberTokens(listing.title);
  let best: { variant: RuntimeCatalogueVariant; confidence: number } | null = null;

  for (const variant of catalogue) {
    const canonical = variant.normalized_name || variant.canonical_name;
    const variantNumbers = valueNumberTokens(canonical);
    if ([...variantNumbers].some((token) => !listingNumbers.has(token))) continue;
    const variantTokens = normaliseTokens(canonical);
    const shared = [...variantTokens].filter((token) => listingTokens.has(token)).length;
    const confidence = shared / Math.max(variantTokens.size, 1);
    if (confidence < 0.62) continue;
    if (!best || confidence > best.confidence) best = { variant, confidence };
  }
  return best;
}

function preliminaryScore(candidate: MatchedListing, input: ProductFinderInput) {
  const requiredProfit = Math.max(input.minimumProfit, requiredProfitFor(candidate.listing.price));
  const roughRoi = candidate.preliminaryProfit / candidate.listing.price;
  const profitPoints = Math.min(50, Math.max(0, (candidate.preliminaryProfit / Math.max(requiredProfit, 1)) * 25));
  const roiPoints = Math.min(40, Math.max(0, roughRoi * 80));
  return profitPoints + roiPoints + candidate.identificationConfidence * 10;
}

function currentDatabaseReference(variant: RuntimeCatalogueVariant) {
  if (!variant.valuation_central_minor || !variant.cache_valid_until || Date.parse(variant.cache_valid_until) <= Date.now()) return 0;
  return moneyFromMinor(variant.valuation_central_minor);
}

function hasFreshDatabaseValuation(variant: RuntimeCatalogueVariant) {
  return Boolean(
    variant.valuation_central_minor &&
    variant.valuation_low_minor &&
    variant.valuation_high_minor &&
    variant.cache_valid_until &&
    Date.parse(variant.cache_valid_until) > Date.now() &&
    Number(variant.valuation_confidence || 0) >= 0.6,
  );
}

function deduplicateListings(listings: MarketplaceListing[]) {
  const seen = new Set<string>();
  return listings.filter((listing) => {
    const key = listing.id || listing.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasFaultLanguage(value: string) {
  return /\b(broken|faulty|spares|repairs?|parts|not working|wanted|swap only)\b/i.test(value);
}

function listingMatchesSearchCriteria(listing: MarketplaceListing, input: ProductFinderInput) {
  if (listing.currency && listing.currency !== "GBP") return false;
  if (listing.price <= 0 || listing.price > input.maximumBuyPrice) return false;
  if (hasFaultLanguage(listing.title) || /\b(case|cover|screen protector|charger|charging cable|empty box|box only|dummy|replica)\b/i.test(listing.title)) return false;
  if (input.query.trim()) return matchesRequestedProduct(input.query, listing.title);
  return matchesCategoryTitle(input.category, listing.title);
}

function matchesCategoryTitle(category: string, title: string) {
  const patterns: Record<string, RegExp> = {
    Phones: /\b(iphone|smartphone|mobile phone|samsung galaxy|google pixel|oneplus|nokia|motorola|honor|xiaomi)\b/i,
    Laptops: /\b(laptop|macbook|notebook|chromebook|thinkpad|surface laptop)\b/i,
    "PC Consoles": /\b(playstation|ps[345]|xbox|gaming pc|desktop pc|nintendo switch|console)\b/i,
    "Handhelds & VR": /\b(steam deck|rog ally|handheld|oculus|meta quest|vr headset)\b/i,
    "Cameras & Lenses": /\b(camera|dslr|mirrorless|lens|canon eos|sony alpha|nikon)\b/i,
    "Tablets, iPads & Surface": /\b(ipad|tablet|surface pro|galaxy tab)\b/i,
    Monitors: /\b(monitor|display|gaming screen)\b/i,
    "Bikes & E-bikes": /\b(bike|bicycle|e-bike|ebike|mountain bike|road bike)\b/i,
    Audio: /\b(headphones|earbuds|speaker|amplifier|soundbar|airpods|audio)\b/i,
    "Power Tools": /\b(drill|saw|sander|impact driver|power tool|dewalt|makita|milwaukee)\b/i,
    "Wearables & GPS": /\b(smartwatch|apple watch|garmin|fitbit|gps watch)\b/i,
    "Drones & Action Cameras": /\b(drone|dji|gopro|action camera)\b/i,
    "TVs & Projectors": /\b(tv|television|projector|oled|qled)\b/i,
    "DJ & Music Equipment": /\b(dj|mixer|turntable|controller|synthesizer|keyboard|guitar|microphone)\b/i,
  };
  const pattern = patterns[category];
  if (pattern) return pattern.test(title);
  const categoryTokens = normaliseTokens(category);
  const titleTokens = normaliseTokens(title);
  return [...categoryTokens].some((token) => titleTokens.has(token));
}

async function locationsWithinRadius(locations: string[], targetLocation: string, radiusMiles: number) {
  const target = await geocodeUkPlace(targetLocation);
  if (!target) return locations.map(() => false);
  const cache = new Map<string, Promise<PlaceCoordinates | null>>();
  return mapWithConcurrency(locations, 8, async (location) => {
    const key = location.trim().toLowerCase();
    let pending = cache.get(key);
    if (!pending) {
      pending = geocodeUkPlace(location);
      cache.set(key, pending);
    }
    const coordinates = await pending;
    return Boolean(coordinates && haversineMiles(target, coordinates) <= radiusMiles);
  });
}

async function geocodeUkPlace(value: string): Promise<PlaceCoordinates | null> {
  const query = value.split(",")[0]?.trim();
  if (!query) return null;
  const url = new URL("https://api.postcodes.io/places");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  try {
    const response = await providerFetch(url, {});
    if (!response.ok) return null;
    const body = await readProviderJson<{ result?: Array<{
      name_1?: string;
      name_2?: string | null;
      local_type?: string;
      latitude?: number | string;
      longitude?: number | string;
    }> }>(response);
    const normalisedQuery = query.toLowerCase();
    const placeTypeScores: Record<string, number> = {
      "Capital City": 40,
      City: 35,
      Town: 30,
      "Other Settlement": 25,
      Village: 20,
      "Suburban Area": 15,
      Hamlet: 5,
    };
    const ranked = (body.result || []).map((place) => {
      const primary = (place.name_1 || "").toLowerCase();
      const secondary = (place.name_2 || "").toLowerCase();
      const exactScore = primary === normalisedQuery ? 100 : secondary === normalisedQuery ? 90 : primary.includes(normalisedQuery) ? 40 : 0;
      return { place, score: exactScore + (placeTypeScores[place.local_type || ""] || 0) };
    }).sort((a, b) => b.score - a.score);
    const best = ranked[0]?.place;
    const latitude = Number(best?.latitude);
    const longitude = Number(best?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
}

function haversineMiles(left: PlaceCoordinates, right: PlaceCoordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(left.latitude)) * Math.cos(radians(right.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchingValueNumbers(left: string, right: string) {
  const expected = valueNumberTokens(left);
  const actual = valueNumberTokens(right);
  return [...expected].every((token) => actual.has(token));
}

function valueNumberTokens(value: string) {
  return new Set(value.toLowerCase().match(/\b\d+(?:tb|gb|inch|in)?\b/g) || []);
}

function moneyFromMinor(value: number | null) {
  return value ? value / 100 : 0;
}

function requiredProfitFor(price: number) {
  if (price <= 30) return 10;
  if (price <= 75) return 20;
  if (price <= 150) return 30;
  if (price <= 300) return 40;
  if (price <= 500) return 60;
  return 80;
}

function demandFromCount(count: number): "Low" | "Medium" | "High" {
  return count >= 15 ? "High" : count >= 5 ? "Medium" : "Low";
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const position = (values.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return values[lower];
  return values[lower] + (values[upper] - values[lower]) * (position - lower);
}

async function mapWithConcurrency<T, U>(items: T[], concurrency: number, work: (item: T) => Promise<U>): Promise<U[]> {
  const results = new Array<U>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await work(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function retrySoldComps(request: () => Promise<SoldComp[]>) {
  const delays = [0, 1_000, 2_500];
  let lastError: unknown;
  for (const delay of delays) {
    if (delay) await sleep(delay);
    try {
      return await request();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const status = error instanceof ProductFinderProviderError ? error.status : 0;
      if (!(status === 408 || status === 425 || status === 429 || status >= 500 || message.includes("busy") || message.includes("retry"))) {
        throw error;
      }
    }
  }
  throw lastError;
}

async function providerFetch(input: URL, init: RequestInit) {
  try {
    return await fetch(input, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new ProductFinderProviderError("The data provider timed out. Try a more specific product/location.", 504);
    }
    throw new ProductFinderProviderError("The data provider is currently unreachable.", 502);
  }
}

async function readProviderJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}

function readProviderError(value: unknown, fallback: string) {
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.message === "string") return object.message;
    if (typeof object.error === "string") return object.error;
  }
  return fallback;
}

function isRetryableProviderResponse(status: number, body: unknown) {
  if (status === 408 || status === 409 || status === 425 || status === 429 || status >= 500) return true;
  const message = readProviderError(body, "").toLowerCase();
  return message.includes("busy") || message.includes("retry") || message.includes("rate limit") || message.includes("temporarily");
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normaliseTokens(value: string) {
  const ignored = new Set(["the", "and", "with", "for", "from", "used", "new", "boxed", "unlocked", "bundle"]);
  return new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 1 && !ignored.has(token)));
}

function titleSimilarity(left: string, right: string) {
  const a = normaliseTokens(left);
  const b = normaliseTokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.max(a.size, b.size);
}

function matchesRequestedProduct(query: string, title: string) {
  const requested = normaliseTokens(query);
  const candidate = normaliseTokens(title);
  if (!requested.size) return true;

  const requestedNumbers = [...requested].filter((token) => /^\d+[a-z]*$/.test(token));
  if (requestedNumbers.some((token) => !candidate.has(token))) return false;

  const matchingTokens = [...requested].filter((token) => candidate.has(token)).length;
  return matchingTokens / requested.size >= 0.75;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function scoreDeal(deal: AppDeal) {
  const riskPenalty = deal.risk === "Low" ? 0 : deal.risk === "Medium" ? 10 : 25;
  return deal.profit + Math.min(deal.roi, 100) - riskPenalty;
}

function toMoney(value: string | number | null | undefined) {
  const number = typeof value === "number" ? value : Number.parseFloat(value || "");
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function stableId(value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36);
}

function relativeAge(value?: string) {
  if (!value) return "Recently";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1_440) return `${Math.round(minutes / 60)} hr`;
  return `${Math.round(minutes / 1_440)} days`;
}
