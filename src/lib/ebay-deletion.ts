import { createHash, createPublicKey, verify } from "node:crypto";

type Environment = Record<string, string | undefined>;
type JsonObject = Record<string, unknown>;
export type DeletionNotice = {
  notificationId: string;
  eventDate: string;
  userId: string;
  username?: string;
  eiasToken?: string;
};
type Dependencies = {
  publicKey: (keyId: string) => Promise<string>;
  process: (notice: DeletionNotice) => Promise<void>;
};

function json(body: JsonObject, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject : {};
}

export function challenge(request: Request, env: Environment): Response {
  const token = env.EBAY_DELETION_VERIFICATION_TOKEN ?? "";
  const endpoint = env.EBAY_DELETION_ENDPOINT ?? "";
  let parsed: URL;
  try { parsed = new URL(endpoint); } catch { return json({ error: "Not configured" }, 503); }
  if (!/^[A-Za-z0-9_-]{32,80}$/.test(token) || parsed.protocol !== "https:" ||
      parsed.username || parsed.password || parsed.search || parsed.hash) {
    return json({ error: "Not configured" }, 503);
  }
  // Prevent registration before the actual deletion processor is ready.
  if (env.EBAY_DELETION_PROCESSOR_READY !== "true") return json({ error: "Deletion processing not ready" }, 503);
  const code = new URL(request.url).searchParams.get("challenge_code");
  if (!code || code.length > 2048) return json({ error: "Invalid challenge" }, 400);
  return json({ challengeResponse: createHash("sha256").update(code).update(token).update(endpoint).digest("hex") }, 200);
}

export async function receive(request: Request, dependencies: Dependencies): Promise<Response> {
  const header = request.headers.get("x-ebay-signature");
  if (!header || header.length > 8192) return json({ error: "Invalid signature" }, 412);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "JSON required" }, 415);
  }
  // Bound streamed input as well as Content-Length; do not log notification bodies.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Invalid body" }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 65536) { await reader.cancel(); return json({ error: "Body too large" }, 413); }
    chunks.push(part.value);
  }
  let message: JsonObject;
  let signature: JsonObject;
  try {
    message = object(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    signature = object(JSON.parse(Buffer.from(header, "base64").toString("utf8")));
  } catch { return json({ error: "Invalid notification" }, 400); }
  if (typeof signature.kid !== "string" || !/^[A-Za-z0-9_-]{1,256}$/.test(signature.kid) ||
      typeof signature.signature !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature.signature)) {
    return json({ error: "Invalid signature" }, 412);
  }
  let key: string;
  try { key = await dependencies.publicKey(signature.kid); }
  catch { return json({ error: "Verification unavailable" }, 503); }
  try {
    // eBay's reference SDK signs JSON.stringify(message) using ECDSA/SHA-1.
    // The digest is protocol-defined, never selected from untrusted header data.
    const publicKey = createPublicKey(key);
    if (publicKey.asymmetricKeyType !== "ec" ||
        !verify("sha1", Buffer.from(JSON.stringify(message)), publicKey, Buffer.from(signature.signature, "base64"))) {
      return json({ error: "Invalid signature" }, 412);
    }
  } catch { return json({ error: "Invalid signature" }, 412); }
  const metadata = object(message.metadata);
  const notification = object(message.notification);
  const data = object(notification.data);
  if (metadata.topic !== "MARKETPLACE_ACCOUNT_DELETION" || metadata.schemaVersion !== "1.0" ||
      typeof notification.notificationId !== "string" || !notification.notificationId || notification.notificationId.length > 256 ||
      typeof notification.eventDate !== "string" || !Number.isFinite(Date.parse(notification.eventDate)) ||
      typeof data.userId !== "string" || !data.userId || data.userId.length > 1024 ||
      [data.username, data.eiasToken].some(value => value !== undefined && (typeof value !== "string" || value.length > 4096))) {
    return json({ error: "Unsupported notification" }, 400);
  }
  try {
    await dependencies.process({ notificationId: notification.notificationId, eventDate: notification.eventDate,
      userId: data.userId, username: data.username as string | undefined, eiasToken: data.eiasToken as string | undefined });
  } catch { return json({ error: "Deletion processing unavailable" }, 503); }
  // Acknowledge only after the real processor reports success.
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export function ebayPublicKeys(env: Environment, fetcher: typeof fetch = fetch) {
  const keys = new Map<string, { pem: string; expires: number }>();
  let token: { value: string; expires: number } | undefined;
  return async (kid: string): Promise<string> => {
    const cached = keys.get(kid);
    if (cached && cached.expires > Date.now()) return cached.pem;
    if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) throw new Error("Missing eBay credentials");
    if (!token || token.expires <= Date.now()) {
      const response = await fetcher("https://api.ebay.com/identity/v1/oauth2/token", {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Basic ${Buffer.from(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", scope: "https://api.ebay.com/oauth/api_scope" }),
      });
      if (!response.ok) throw new Error("Token unavailable");
      const body = object(await response.json());
      if (typeof body.access_token !== "string" || typeof body.expires_in !== "number" || body.expires_in <= 60) throw new Error("Invalid token response");
      token = { value: body.access_token, expires: Date.now() + Math.min(body.expires_in - 60, 3600) * 1000 };
    }
    const response = await fetcher(`https://api.ebay.com/commerce/notification/v1/public_key/${encodeURIComponent(kid)}`, {
      headers: { Authorization: `Bearer ${token.value}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) { if (response.status === 401) token = undefined; throw new Error("Public key unavailable"); }
    const body = object(await response.json());
    if (typeof body.key !== "string" || body.key.length > 16384) throw new Error("Invalid public key");
    // Bounded, ephemeral verification-key cache; no user data is cached here.
    if (keys.size >= 100) keys.delete(keys.keys().next().value!);
    keys.set(kid, { pem: body.key, expires: Date.now() + 3600000 });
    return body.key;
  };
}
