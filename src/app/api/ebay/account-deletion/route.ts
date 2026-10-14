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
      // This new operation MUST be implemented and audited in the database gateway
      // before enabling the readiness flag. Current gateway rejects unknown actions.
      const response = await fetch(endpoint, {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json", "x-flipbot-internal-key": key },
        body: JSON.stringify({ action: "process_ebay_deletion", payload: notice }),
      });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) throw new Error("Deletion not completed");
    },
  });
}
