# eBay marketplace account deletion

The public receiver is `/api/ebay/account-deletion`. It answers eBay's challenge,
authenticates signatures using eBay public keys, and acknowledges only after the
private processor commits. Failures return retryable 503 responses. Invalid signatures
never reach storage. Notification bodies and credentials are not logged.

## Storage

`docs/ebay-privacy-schema.sql` records the applied migration. The private `flipbot_ebay`
schema is reserved for the new official API integration. RLS is enabled without browser
policies; only the service role has access. The existing catalogue is not modified.

Future ingestion must retain seller identifiers in `user_data` and link persisted
derived results through `derived_data.source_id`. Extend deletion before storing API
user data elsewhere. The processor matches user ID, username or EIAS token, cascades
dependent results, records hashed deletion markers to block re-import, and handles
duplicate notification IDs. No-match notices are also recorded and acknowledged.
All operations are transactional. After backup restores, reapply deletions and markers
before serving or importing restored data. Add future caches and exports to this process.

`supabase/functions/flipbot-ebay-privacy/index.ts` is the deployed authenticated gateway.
It reuses the server-only runtime credential. The website derives its URL from the
existing `FLIPBOT_RUNTIME_URL`; the old runtime function is unchanged.

## Configuration and registration

- `EBAY_CLIENT_ID`: production App ID.
- `EBAY_CLIENT_SECRET`: production Cert ID; server-only, never committed.
- `EBAY_DELETION_ENDPOINT`: `https://www.flipbot.me/api/ebay/account-deletion`.
- `EBAY_DELETION_VERIFICATION_TOKEN`: independent random 32-80 character token,
  letters, digits, underscore and hyphen; not the Client Secret.
- Existing `FLIPBOT_RUNTIME_URL` and `FLIPBOT_RUNTIME_KEY` settings.
- `EBAY_DELETION_PROCESSOR_READY=true`: after deploying and verifying the processor.

Deploy with these settings, verify the exact canonical URL, then register the alert
email, endpoint and token in eBay Marketplace Account Deletion settings. Send eBay's
test notification and confirm delivery and keyset compliance. Do not select an
exemption. This does not itself grant restricted sold-history API access.

## Validation

Run `node --experimental-strip-types --test test/ebay-deletion.test.mjs` and
`node node_modules/typescript/bin/tsc --noEmit`.
Rolled-back database fixtures verified deletion, dependent removal, isolation of
another seller, duplicate handling and rejection of re-import. Live signed delivery
from eBay remains a deployment verification step.

Protocol: https://developer.ebay.com/develop/guides/sell/marketplace-user-account-deletion
Signature reference: https://github.com/eBay/event-notification-nodejs-sdk/blob/main/lib/validator.js
