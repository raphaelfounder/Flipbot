# Flipbot Dashboard

Flipbot is a reseller workspace for finding marketplace opportunities, checking resale prices, scanning products, saving deals, and managing account/settings pages.

This repository contains the current dashboard prototype built with Next.js.

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add private provider keys in `.env.local`. Do not commit `.env.local`.

Required for the live Product Finder prototype:

- `BRIGHT_DATA_API_KEY`
- `SOLD_COMPS_API_KEY`
- `BRIGHT_DATA_FACEBOOK_MARKETPLACE_DATASET_ID`

Optional for the future Supabase runtime:

- `SUPABASE_URL`
- `FLIPBOT_RUNTIME_URL`
- `FLIPBOT_RUNTIME_KEY`

## Development

Run the dashboard:

```bash
pnpm dev --hostname localhost --port 3000
```

Open:

```text
http://localhost:3000/app?live-test=1
```

Use `localhost`, not `127.0.0.1`, because the local Next.js dev server can block client-side chunks on the `127.0.0.1` origin.

## Notes

- Facebook Marketplace discovery uses Bright Data and may return a pending snapshot while listings are collected.
- eBay pricing and sold-comps lookup uses SoldComps.
- Real API keys should be rotated before production use.
- `.env.local`, `.next`, `node_modules`, logs, and build output are ignored by Git.
