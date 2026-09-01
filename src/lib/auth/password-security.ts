import "server-only";

import { createHash } from "node:crypto";

import { validatePassword } from "@/lib/auth/password-policy";

async function appearsInKnownBreach(password: string): Promise<boolean> {
  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "Flipbot password safety check" },
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const matches = await response.text();
    return matches.split("\n").some((line) => line.split(":", 1)[0]?.trim() === suffix);
  } catch {
    // The local strength policy still applies if the optional breach service is unavailable.
    return false;
  }
}

export async function validatePasswordSecurely(password: string, personalTerms: string[] = []) {
  const policyError = validatePassword(password, personalTerms);
  if (policyError) return policyError;
  if (await appearsInKnownBreach(password)) return "That password has appeared in a known data breach. Choose a different one.";
  return null;
}
