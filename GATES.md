# Gates: Flipbot complete UI prototype

Ledger root: the directory containing this file.

## G1: Finder includes filtering, loading, empty, error and pagination states

  CHECK: node scripts/verify-dashboard-ui.mjs finder
  EXPECT: UI_OK_FINDER
  TIMEOUT: 120000

## G2: Deal inspection and saved-deal management include valuation, risk, status, notes and buyer-price states

  CHECK: node scripts/verify-dashboard-ui.mjs deals
  EXPECT: UI_OK_DEALS
  TIMEOUT: 120000

## G3: Scanner covers upload, preview, analysing, identification, error and valuation states

  CHECK: node scripts/verify-dashboard-ui.mjs scanner
  EXPECT: UI_OK_SCANNER
  TIMEOUT: 120000

## G4: Onboarding, membership, credits, account, settings and help are complete without fake live purchasing

  CHECK: node scripts/verify-dashboard-ui.mjs account
  EXPECT: UI_OK_ACCOUNT
  TIMEOUT: 120000

## G5: UI source contains accessibility and responsive interaction safeguards

  CHECK: node scripts/verify-dashboard-ui.mjs accessibility
  EXPECT: UI_OK_ACCESSIBILITY
  TIMEOUT: 120000

## G6: Saved deals, notes, unlocks, onboarding completion, and finder defaults behave as durable account-scoped UI state

  CHECK: node scripts/verify-dashboard-ui.mjs persistence
  EXPECT: UI_OK_PERSISTENCE
  TIMEOUT: 120000

## G7: The complete frontend passes static lint checks

  CHECK: node scripts/verify-lint.mjs
  EXPECT: UNLAZY_OK_G2
  TIMEOUT: 180000

## G8: The complete Next.js application produces a successful production build

  CHECK: node scripts/verify-build.mjs
  EXPECT: UNLAZY_OK_G3
  TIMEOUT: 300000

## G9: Changed interface surfaces pass the Impeccable mechanical detector

  CHECK: node scripts/verify-impeccable.mjs
  EXPECT: UNLAZY_OK_IMPECCABLE
  TIMEOUT: 180000

## G10: Authenticated dashboard is visually inspected at desktop and mobile widths

  MANUAL: met
  EVIDENCE: Inspected the development-only dashboard preview at desktop and 390x844 mobile widths. Verified onboarding, finder, deal inspection, scanner layout, saved-deal notes and reload persistence, responsive navigation, and clear representative-data labelling.
