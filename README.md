# Flipbot — Website and Software Dashboard

Next.js 16 project containing the public Flipbot landing page, authenticated software dashboard and associated server routes.

**Co-founder / ChatGPT handoff:** Start with [HANDOFF.md](./HANDOFF.md). It contains Windows and macOS launch instructions, code entry points, environment setup, integration dependencies, validation, Vercel deployment and a copy-ready prompt for another ChatGPT.

## Quick start

Requirements: compatible Node.js LTS and pnpm (see the `packageManager` field in `package.json`).

```bash
corepack enable
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`; macOS/Linux: `cp .env.example .env.local`) and fill in credentials for the features you want to test. Never commit `.env.local`.

```bash
pnpm dev --hostname localhost --port 3000
```

- Landing website: http://localhost:3000
- Signed-in dashboard: http://localhost:3000/app (Supabase Auth configuration required)
- Development-only dashboard preview with mock data: http://localhost:3000/dashboard-preview
- Product Finder test query: http://localhost:3000/app?live-test=1 (requires relevant integrations)

## Validation

```bash
pnpm lint
pnpm build
pnpm start
```

These are commands for the receiving developer to run; they have **not** been independently verified as passing in this handoff.

## Integrations

Follow `.env.example` for current variable names. It includes Supabase authentication/runtime, marketplace provider credentials (`APIFY_API_TOKEN`), SoldComps, Stripe, scanner processor, eBay account deletion processing, and Turnstile. Some require separately deployed backend services or database setup. Do not confuse present UI with complete live integrations.

For project intent and constraints read `PRODUCT.md`, `DESIGN.md`, `GATES.md`, and `LEGAL-OPERATIONS.md`. For Next.js coding-agent rules read `AGENTS.md`.

**Note:** newer desktop-only changes are not in this ZIP unless they were pushed to this GitHub repository.
