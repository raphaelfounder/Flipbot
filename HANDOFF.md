# Flipbot — co-founder handoff and launch guide

> This repository is the source snapshot, not a turnkey live service. Read this document and `README.md` before changing code. **Never invent API keys, treat demo data as real data, or expose server credentials to the browser.**

## For the receiving ChatGPT

The co-founder will upload a ZIP of this GitHub repository and ask you to open/run it. First inspect `package.json`, `.env.example`, `AGENTS.md`, `src/app`, `src/components`, `src/lib`, and the documents `PRODUCT.md`, `DESIGN.md`, `GATES.md`, `LEGAL-OPERATIONS.md`. Report what is implemented vs stubbed/mock. Do not redesign the product, replace the branding, or re-implement services without an explicit instruction. Protect existing code and make small, verified changes.

**Important distinction:** the landing site and software dashboard are in the same Next.js repository. A separately developed desktop/demo iteration is **not automatically represented here** unless its changes were committed and pushed; compare screenshots/feature descriptions with current files before asserting they match.

## Requirements

- Node.js version compatible with Next.js 16 (use current Node.js LTS, preferably Node.js 22 or newer).
- pnpm (repository declares `pnpm@11.16.0`). Enable Corepack if needed.
- Internet to install packages.
- Credentials/accounts for connected features; local UI can be inspected without all integrations, but protected routes need Supabase Auth.

## Launch locally (Windows PowerShell)

1. Download **Code → Download ZIP** from GitHub, extract it, and open a terminal **inside the extracted folder containing `package.json`**.
2. Run:

```powershell
node --version
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

3. Edit `.env.local` and supply the keys for the features being exercised. Do not paste secrets into ChatGPT or commit `.env.local`. For local auth, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
4. Run:

```powershell
pnpm dev --hostname localhost --port 3000
```

5. Open `http://localhost:3000` for the public landing page. Open `http://localhost:3000/app` for the signed-in software. The `/dashboard-preview` route is **development-only** and uses preview data. The README also documents a Product Finder test at `/app?live-test=1` (requires an authenticated session and appropriately configured providers).

On macOS/Linux replace `Copy-Item .env.example .env.local` with `cp .env.example .env.local`.

## Main project entry points

| Path | Purpose |
|---|---|
| `src/app/page.tsx` | Public landing route |
| `src/components/landing.tsx` | Landing UI |
| `src/app/app/page.tsx` | Authenticated software route; fetches Supabase profile/settings/credits |
| `src/components/software-app.tsx` | Main software interface |
| `src/components/flipbot-dashboard.tsx` | Dashboard-preview component |
| `src/app/dashboard-preview/page.tsx` | Local-only preview route; not available in production |
| `src/app/api/` | Server API routes/integrations |
| `src/lib/` | Shared logic, providers and authentication |
| `src/app/globals.css` | Global styles |
| `.env.example` | Environment variable names and guidance |

## Integrations / configuration

Read the inline comments in `.env.example` as the source of truth for exact variable names. They currently cover:

- **Supabase** Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; runtime gateway `SUPABASE_URL`, `FLIPBOT_RUNTIME_URL`, `FLIPBOT_RUNTIME_KEY`. The Supabase project must have required tables/policies/functions deployed; a blank Supabase project is insufficient.
- **Marketplace and resale comps**: `APIFY_API_TOKEN`, `SOLD_COMPS_API_KEY`. Do not assume an older Bright Data config from a historic README is still the current integration.
- **Stripe billing**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`. Production needs webhook configuration and testing before accepting subscriptions.
- **Scanner**: `SCANNER_PROCESSOR_URL`, `SCANNER_PROCESSOR_KEY` for the separately hosted processor.
- **eBay deletion compliance**: variables prefixed `EBAY_`, including the verification token and external processor settings. Do not enable the processor-ready flag without a tested receiving service.
- **Turnstile**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` where applicable.

All secrets must remain server-side. Only publishable public values use `NEXT_PUBLIC_`. Avoid copying production secrets into screenshots, prompts or ZIP archives.

## Verification checklist

Run in the extracted project root:

```powershell
pnpm lint
pnpm build
```

Then start a production-style local server with `pnpm start` (after a successful build), and check landing, sign-in, sign-up, signed-in app, mobile navigation, API error handling, billing test mode and auth redirect URLs. Run integration checks only with appropriately authorised test credentials. Do not claim the site or services work merely because the files exist; record failures and missing configuration.

## Deployment (Vercel)

Connect this repository to Vercel using the Next.js framework preset. Install/build using the package manager and scripts declared in `package.json` (`pnpm install --frozen-lockfile`, `pnpm build`). Configure production environment variables in Vercel project settings and ensure `NEXT_PUBLIC_SITE_URL` is set to the canonical production URL. Configure Supabase authentication redirect URLs for that domain. Point the authorised domain/DNS at the intended Vercel deployment, test Stripe webhooks and backend integrations, then verify the deployed login, pages and security-sensitive flows. Do not replace live production configuration without approval.

## Handoff precautions

1. Check whether the ZIP is the newest GitHub commit and whether newer local-only desktop changes exist.
2. Retain original source code, artwork, brand identity and environment variable names.
3. Distinguish static UI/demo fixtures from live provider-connected functions.
4. Never introduce credentials into tracked files; `.env.local` belongs only on each developer's machine.
5. Summarise any incomplete dependencies, build errors, and exact test outcomes before calling the handoff complete.

## Useful initial prompt to the co-founder's ChatGPT

> Open this Flipbot repo ZIP. Read HANDOFF.md, README.md, AGENTS.md, PRODUCT.md, DESIGN.md, GATES.md, LEGAL-OPERATIONS.md, package.json and .env.example before editing. Identify current landing page and signed-in software UI, inspect which data is mocked vs live, then install and attempt the prescribed build checks in your environment. Tell me which credentials and separate services are required. Do not modify branding, production settings, payment systems, or the code architecture unless I ask. Keep secrets out of your output.
