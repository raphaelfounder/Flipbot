# Flipbot legal and privacy operations

Owner: Fornix Digital, a partnership between Raphael Richardson and Oliver Sierra
Contact: team@flipbot.me
Business address: Office 21119, 182–184 High Street North, East Ham, London, E6 2JA, United Kingdom

## Before paid public launch

- Complete and retain the ICO data-protection fee self-assessment; pay and register if the result requires it.
- Choose a nominated partner, register the partnership with HMRC when required, and ensure both partners register for Self Assessment.
- Sign a partnership agreement covering ownership, profit shares, authority, departures, disputes and all Flipbot intellectual property.
- Confirm Stripe prices, taxes, plan allowances, renewal timing and checkout wording in GBP.
- Execute current data-processing terms with every provider that handles personal data and record the lawful international-transfer mechanism.
- Run a production cookie and browser-storage audit. Do not enable optional analytics or advertising before any legally required consent control works.
- Test account access, correction, export, marketing withdrawal and deletion from a normal user account.
- Obtain qualified UK legal review of the public policies and checkout before accepting payment.

## Data inventory and retention

| Information | Purpose | Normal retention |
| --- | --- | --- |
| Account and profile | Authentication and service delivery | Active account; remove from active systems within 30 days after deletion |
| Legal acceptance history | Prove the contract and notice version accepted | Contract limitation period and any longer period required for a dispute |
| Marketing preference | Record opt-in or withdrawal | While relevant, plus suppression evidence needed to respect withdrawal |
| Saved searches and deals | User-requested product functionality | Until the user deletes them or closes the account |
| Scanner image | Identify the submitted item | Delete automatically when processing finishes; no backup or debugging copy |
| Credit account and ledger | Deliver allowances, resolve failures and disputes | Active account and applicable accounting or dispute period |
| Support correspondence | Answer requests and document resolution | Up to two years unless a dispute or legal duty requires longer |
| Authentication and security logs | Prevent abuse and investigate incidents | Up to 12 months unless an active investigation requires longer |
| Billing and tax records | Accounting and legal compliance | Period required by applicable tax and accounting law |

## Privacy requests

1. Record the request date, scope and contact channel without copying unnecessary identity documents.
2. Verify identity proportionately using the authenticated account or information already held.
3. Search Supabase authentication, profile, preferences, searches, saved deals, consent, credit, billing and support systems.
4. Restrict processing when required while the request is assessed.
5. Respond within the applicable legal deadline. Under UK GDPR this is normally one month, subject to lawful extensions.
6. Record what was disclosed, corrected, deleted or refused and the lawful reason.
7. Tell the requester how to complain to the ICO or applicable local authority.

## Security incidents and personal-data breaches

1. Contain the incident: revoke affected sessions and credentials, restrict access and preserve relevant logs.
2. Record when it was discovered, systems and people affected, data categories, likely consequences and mitigation.
3. Determine whether personal data was accessed, lost, altered or disclosed without authority.
4. Assess risk to individuals. Notify the ICO without undue delay and, where feasible, within 72 hours when UK law requires it.
5. Notify affected people promptly when the breach is likely to create a high risk, using plain language and practical protective steps.
6. Fix the cause, test the fix, rotate affected secrets and document the decision whether or not notification was required.

## Access and secrets

- Give production access only to people who need it and use individual administrator accounts with multi-factor authentication.
- Never place Supabase service-role keys, Stripe secret keys, webhook secrets or provider tokens in browser code or the repository.
- Keep production and development credentials separate and rotate credentials after suspected exposure or a partner's departure.
- Review privileged accounts and provider access at least every three months.
- Log material administrator actions without logging passwords, full payment-card data or Scanner images.

## Support and complaints

- Receive requests at team@flipbot.me.
- Aim to acknowledge complaints within five working days and provide a substantive response within 15 working days.
- Never ask for a password or full card number.
- Escalate payment disputes, privacy requests, security incidents and threats of legal action to both partners.
- Preserve evidence relevant to an active dispute; resume normal deletion when the hold is no longer justified.

## Credit failure handling

- Use a unique idempotency key for every chargeable operation.
- Deduct monthly credits first, then purchased credits.
- Never deduct credits twice when a request is retried.
- If the operation fails after deduction, restore the exact monthly and purchased amounts automatically and link the restoration to the original ledger entry.
- Do not resurrect expired monthly credits through a delayed manual adjustment without documenting the reason.

## Review cycle

Review this file and the public policies before launch, whenever a provider or data use changes, before entering a new actively targeted country, and at least annually.
