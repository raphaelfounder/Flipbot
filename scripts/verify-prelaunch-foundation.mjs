import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (text, values) => {
  for (const value of values) {
    if (!text.includes(value)) throw new Error(`Missing required implementation marker: ${value}`);
  }
};
const rejectText = (text, values) => {
  for (const value of values) {
    if (text.includes(value)) throw new Error(`Forbidden draft marker remains: ${value}`);
  }
};

if (mode === "legal") {
  const copy = read("src/lib/flipbot-copy.ts");
  requireText(copy, ["Fornix Digital", "Raphael Richardson", "Oliver Sierra", "Office 21119", "182–184 High Street North", "Last updated 3 September 2026", "Fourteen-day cancellation right", "Monthly credits expire", "purchased credits do not expire"]);
  rejectText(copy, ["draftNote", "Draft for review", "OWNER TO CONFIRM", "must be added before publication"]);
  console.log("UNLAZY_OK_LEGAL");
} else if (mode === "consent") {
  const signUp = read("src/app/auth/actions.ts") + read("src/components/auth/sign-up-form.tsx") + read("src/lib/legal.ts");
  const migration = read("supabase/migrations/20260903190000_legal_consent_and_credit_ledger.sql");
  requireText(signUp, ["acceptedTerms", "marketingConsent", "marketing_email_consent", "accepted_terms_version", "LEGAL_VERSION"]);
  requireText(migration, ["create table public.legal_acceptances", "create table public.marketing_preferences", "email_opt_in boolean not null default false"]);
  console.log("UNLAZY_OK_CONSENT");
} else if (mode === "credits") {
  const migration = read("supabase/migrations/20260903190000_legal_consent_and_credit_ledger.sql");
  const dashboard = read("src/components/flipbot-dashboard.tsx");
  requireText(migration, ["subscription_credits", "subscription_credits_expire_at", "purchased_credits", "idempotency_key", "for update", "subscription_spend := least", "restore_credit_entry", "related_entry_id"]);
  requireText(dashboard, ["Monthly credits", "Purchased credits", "Monthly credits are used first"]);
  console.log("UNLAZY_OK_CREDITS");
} else if (mode === "rls") {
  const base = read("supabase/migrations/20260823151340_flipbot_account_system.sql");
  const migration = read("supabase/migrations/20260903190000_legal_consent_and_credit_ledger.sql");
  for (const table of ["profiles", "user_settings"]) requireText(base, [`alter table public.${table} enable row level security`, `(select auth.uid()) = id`]);
  for (const table of ["legal_acceptances", "marketing_preferences", "credit_accounts", "credit_ledger"]) requireText(migration, [`alter table public.${table} enable row level security`]);
  requireText(migration, ["(select auth.uid()) = user_id", "revoke all on public.legal_acceptances"]);
  console.log("UNLAZY_OK_RLS");
} else if (mode === "account") {
  const dashboard = read("src/components/flipbot-dashboard.tsx");
  const actions = read("src/app/app/actions.ts");
  const dataExport = read("src/app/api/account/export/route.ts");
  requireText(dashboard, ["updateProfileAction", "updatePasswordAction", "signOutOtherSessionsAction", "deleteAccountAction", "Download my data"]);
  requireText(actions, ["supabase.auth.updateUser({ email })", "supabase.auth.updateUser({ password: nextPassword })", "scope: \"others\"", "deleteRuntimeAccount"]);
  requireText(dataExport, ["legal_acceptances", "marketing_preference", "credit_ledger", "Cache-Control"]);
  console.log("UNLAZY_OK_ACCOUNT");
} else if (mode === "operations") {
  const operations = read("LEGAL-OPERATIONS.md");
  requireText(operations, ["Before paid public launch", "Privacy requests", "Security incidents and personal-data breaches", "within 72 hours", "Access and secrets", "Credit failure handling", "team@flipbot.me"]);
  rejectText(operations, ["TBD", "TODO", "placeholder", "AI-generated"]);
  console.log("UNLAZY_OK_OPERATIONS");
} else {
  throw new Error("Choose legal, consent, credits, rls, account or operations");
}
