export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORD_PARTS = [
  "password", "passw0rd", "qwerty", "letmein", "welcome", "admin", "football",
  "monkey", "dragon", "iloveyou", "123456", "12345678", "abc123", "flipbot",
];

const SEQUENCES = ["0123456789", "9876543210", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop", "poiuytrewq"];

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  suggestions: string[];
};

export function measurePasswordStrength(password: string, personalTerms: string[] = []): PasswordStrength {
  const lower = password.toLowerCase();
  const suggestions: string[] = [];
  let points = 0;

  if (password.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  const common = COMMON_PASSWORD_PARTS.some((term) => lower.includes(term));
  const personal = personalTerms
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 3)
    .some((term) => lower.includes(term));
  const sequence = SEQUENCES.some((candidate) => candidate.includes(lower) || (lower.length >= 4 && candidate.includes(lower.slice(0, 8))));
  const repeated = /(.)\1{3,}/i.test(password) || /(.{2,})\1{2,}/i.test(password);

  if (common) points -= 3;
  if (personal) points -= 2;
  if (sequence) points -= 2;
  if (repeated) points -= 2;

  if (password.length < PASSWORD_MIN_LENGTH) suggestions.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (common || sequence || repeated) suggestions.push("Avoid common words, sequences and repeated characters.");
  if (personal) suggestions.push("Do not include your name, username or email.");
  if (password.length < 12 && !common && !sequence && !repeated) suggestions.push("Make it longer or use a memorable passphrase.");

  const score = Math.max(0, Math.min(4, Math.floor(points / 2))) as PasswordStrength["score"];
  const labels: PasswordStrength["label"][] = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
  return { score, label: labels[score], suggestions };
}

export function validatePassword(password: string, personalTerms: string[] = []): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Use no more than ${PASSWORD_MAX_LENGTH} characters.`;
  const result = measurePasswordStrength(password, personalTerms);
  if (result.score < 2) return result.suggestions[0] || "Choose a less predictable password.";
  return null;
}
