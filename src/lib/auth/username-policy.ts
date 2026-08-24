export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "auth", "billing", "flipbot", "help", "moderator",
  "null", "official", "root", "security", "staff", "support", "system", "undefined", "www",
]);

// Kept deliberately narrow to reduce false positives. Normalisation catches common substitutions.
const BLOCKED_FRAGMENTS = ["nigger", "nigga", "faggot", "kike", "chink", "spic", "retard"];

function canonicalise(username: string) {
  return username
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4|@/g, "a")
    .replace(/5|\$/g, "s")
    .replace(/7/g, "t")
    .replace(/[_\-.]/g, "");
}

export function validateUsername(username: string): string | null {
  if (!/^[a-z0-9][a-z0-9_]{1,22}[a-z0-9]$/.test(username)) {
    return "Use 3–24 lowercase letters, numbers or underscores, starting and ending with a letter or number.";
  }
  if (username.includes("__")) return "Use only one underscore at a time.";
  if (RESERVED_USERNAMES.has(username)) return "That username is reserved. Choose another one.";
  const canonical = canonicalise(username);
  if (BLOCKED_FRAGMENTS.some((term) => canonical.includes(term))) return "That username is not allowed. Choose another one.";
  return null;
}
