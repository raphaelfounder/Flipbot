import { challenge, receive, ebayPublicKeys } from "@/lib/ebay-deletion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicKey = ebayPublicKeys(process.env);

export function GET(request: Request) {
  return challenge(request, process.env);
}

export async function POST(request: Request) {
  if (process.env.EBAY_DELETION_PROCESSOR_READY !== "true") {
    return Response.json({ error: "Deletion processing not ready" }, { status: 503 });
  }
  return receive(request, {
    publicKey,
    process: async (notice) => {
      const endpoint = process.env.EBAY_DELETION_PROCESSOR_URL;
      const key = process.env.EBAY_DELETION_PROCESSOR_KEY;
      if (!endpoint || !key) { console.error("eBay deletion: gateway configuration missing"); throw new Error("Runtime unavailable"); }
      const privacyEndpoint = new URL(endpoint);
      if (!privacyEndpoint.pathname.endsWith("/flipbot-ebay-privacy")) { console.error("eBay deletion: gateway URL path incompatible"); throw new Error("Invalid runtime URL"); }
      const response = await fetch(privacyEndpoint, {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json", "x-flipbot-internal-key": key },
        body: JSON.stringify({ action: "process_ebay_deletion", payload: notice }),
      });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) {
        console.error("eBay deletion: gateway did not confirm completion", response.status);
        throw new Error("Deletion not completed");
      }
    },
  });
}
