# eBay deletion receiver — NOT READY FOR PRODUCTION REGISTRATION

The receiver is fail-closed. Keep `EBAY_DELETION_PROCESSOR_READY` unset. Both methods
return 503 until an audited deletion processor exists. Passing a challenge alone
does not make this integration compliant.

## Required remaining work

The 14 October read-only database audit found 28,253 `ebay_sold` comparable rows and
72,511 candidate comparable rows from `soldcomps`. Neither table records seller user
IDs. Do not delete unrelated Flipbot accounts or purge the whole catalogue in response
to an eBay user deletion. Establish seller lineage with the data provider and identify
the associated cached valuations, search results, local exports and backup policy.

Implement the authenticated gateway action `process_ebay_deletion` before enabling
the route. It must process notification IDs idempotently, delete only the relevant
eBay user's retained data, invalidate derived valuations, prevent re-import of removed
data, and return `{ "deleted": true }` only after completion. The existing gateway
does not implement this action; it returns an error. No database changes accompany
this receiver foundation.

## Server configuration after processor completion

- `EBAY_CLIENT_ID`: production App ID.
- `EBAY_CLIENT_SECRET`: production Cert ID, server-only; do not commit or expose it.
- `EBAY_DELETION_ENDPOINT`: exact canonical public HTTPS route, with no redirect.
- `EBAY_DELETION_VERIFICATION_TOKEN`: independent random 32–80 character token using
  letters, digits, underscore and hyphen; not the Client Secret.
- Existing `FLIPBOT_RUNTIME_URL` and `FLIPBOT_RUNTIME_KEY` gateway settings.
- `EBAY_DELETION_PROCESSOR_READY=true`: only after the real processor is verified.

Use a branch/preview before production. Test the route directly, register the alert
email/endpoint/token in eBay, send a test notification, and verify keyset activation.
Do not claim an exemption merely because seller names are absent.

Protocol reference: https://developer.ebay.com/develop/guides/sell/marketplace-user-account-deletion
Signature interoperability reference: https://github.com/eBay/event-notification-nodejs-sdk/blob/main/lib/validator.js

Run: `node --experimental-strip-types --test test/ebay-deletion.test.mjs`.
