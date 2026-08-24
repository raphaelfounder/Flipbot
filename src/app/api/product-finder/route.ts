import { NextResponse } from "next/server";

import {
  advanceDurableFacebookProductFinderSearch,
  finishFacebookProductFinderSearch,
  findProductDeals,
  getProductFinderConfiguration,
  ProductFinderProviderError,
  revealFullSearchAudit,
  revealRejectedShortlist,
  startDurableFacebookProductFinderSearch,
  type ProductFinderInput,
} from "@/lib/product-finder";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { withRuntimeUser } from "@/lib/flipbot-runtime";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ configured: getProductFinderConfiguration() });
}

export async function POST(request: Request) {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return withRuntimeUser(userId, async () => {
    try {
      const input = validateInput(await request.json());
      if (input.source === "Facebook") {
        const pending = await startDurableFacebookProductFinderSearch(input);
        return NextResponse.json({ ...pending, searchedAt: new Date().toISOString() }, { status: 202 });
      }
      const deals = await findProductDeals(input);
      return NextResponse.json({ deals, source: "live", searchedAt: new Date().toISOString() });
    } catch (error) {
      if (error instanceof ProductFinderProviderError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Product Finder failed", error);
      return NextResponse.json({ error: "Product Finder could not complete this search." }, { status: 500 });
    }
  });
}

export async function PUT(request: Request) {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return withRuntimeUser(userId, async () => {
    try {
      const value = await request.json();
      if (!value || typeof value !== "object") {
        throw new ProductFinderProviderError("Invalid search status request.", 400);
      }
      const payload = value as Record<string, unknown>;
      const searchId = typeof payload.searchId === "string" ? payload.searchId.trim() : "";
      if (searchId) {
        if (payload.auditRejected === true) {
          const result = await revealFullSearchAudit(searchId);
          return NextResponse.json({ ...result, searchedAt: new Date().toISOString() });
        }
        if (payload.previewRejected === true) {
          const result = await revealRejectedShortlist(searchId);
          return NextResponse.json({ ...result, searchedAt: new Date().toISOString() });
        }
        const result = await advanceDurableFacebookProductFinderSearch(searchId);
        const status = result.status === "pending" ? 202 : result.status === "failed" ? 502 : 200;
        return NextResponse.json({ ...result, searchedAt: new Date().toISOString() }, { status });
      }

      const snapshotId = typeof payload.snapshotId === "string" ? payload.snapshotId.trim() : "";
      if (!snapshotId) throw new ProductFinderProviderError("Missing Marketplace search reference.", 400);

      const input = validateInput(payload.input);
      if (input.source !== "Facebook") throw new ProductFinderProviderError("Search status is only used for Facebook Marketplace.", 400);

      const deals = await finishFacebookProductFinderSearch(input, snapshotId);
      if (!deals) {
        return NextResponse.json({ status: "pending", snapshotId, searchedAt: new Date().toISOString() }, { status: 202 });
      }
      return NextResponse.json({ status: "complete", deals, source: "live", searchedAt: new Date().toISOString() });
    } catch (error) {
      if (error instanceof ProductFinderProviderError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Product Finder status failed", error);
      return NextResponse.json({ error: "Product Finder could not complete this search." }, { status: 500 });
    }
  });
}

function validateInput(value: unknown): ProductFinderInput {
  if (!value || typeof value !== "object") {
    throw new ProductFinderProviderError("Invalid search request.", 400);
  }
  const input = value as Record<string, unknown>;
  const source = input.source === "Facebook" || input.source === "eBay" ? input.source : null;
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const query = typeof input.query === "string" ? input.query.trim().slice(0, 120) : "";
  const maximumBuyPrice = Number(input.maximumBuyPrice);
  const minimumProfit = Number(input.minimumProfit);
  const location = typeof input.location === "string" ? input.location.trim().slice(0, 100) : undefined;
  const radius = Number(input.radius);
  const fullValidation = input.fullValidation === true;

  if (!source) throw new ProductFinderProviderError("Choose Facebook Marketplace or eBay.", 400);
  if (!category || category === "Any") throw new ProductFinderProviderError("Choose a category.", 400);
  if (!Number.isFinite(maximumBuyPrice) || maximumBuyPrice <= 0 || maximumBuyPrice > 100_000) {
    throw new ProductFinderProviderError("Maximum buy price must be above zero.", 400);
  }
  if (!Number.isFinite(minimumProfit) || minimumProfit < 0 || minimumProfit > 100_000) {
    throw new ProductFinderProviderError("Minimum profit is invalid.", 400);
  }
  if (source === "Facebook" && !location) throw new ProductFinderProviderError("Add a Facebook Marketplace location.", 400);

  return {
    source,
    category,
    query,
    maximumBuyPrice,
    minimumProfit,
    location,
    radius: Number.isFinite(radius) ? Math.min(Math.max(radius, 1), 100) : undefined,
    fullValidation,
  };
}
