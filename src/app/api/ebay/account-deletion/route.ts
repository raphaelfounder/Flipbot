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
      const endpoint = process.env.FLIPBOT_RUNTIME_URL;
      const key = process.env.FLIPBOT_RUNTIME_KEY;
      if (!endpoint || !key) throw new Error("Runtime unavailable");
      const privacyEndpoint = new URL(endpoint);
      privacyEndpoint.pathname = privacyEndpoint.pathname.replace(/\/flipbot-runtime\/?$/, "/flipbot-ebay-privacy");
      if (!privacyEndpoint.pathname.endsWith("/flipbot-ebay-privacy")) throw new Error("Invalid runtime URL");
      const response = await fetch(privacyEndpoint, {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json", "x-flipbot-internal-key": key },
        body: JSON.stringify({ action: "process_ebay_deletion", payload: notice }),
      });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) throw new Error("Deletion not completed");
    },
  });
}
