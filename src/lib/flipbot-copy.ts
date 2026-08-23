export type HelpTopicId =
  | "getting-started"
  | "product-finder"
  | "scanner"
  | "results"
  | "saved-deals"
  | "credits"
  | "account";

export type PolicyId = "privacy" | "cookies" | "terms" | "acceptable-use" | "subscriptions";

export type HelpTopic = {
  id: HelpTopicId;
  title: string;
  summary: string;
  intro: string;
  sections: Array<{ title: string; body: string; bullets?: string[] }>;
};

export type PolicyDocument = {
  id: PolicyId;
  title: string;
  description: string;
  updated: string;
  draftNote?: string;
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
};

export const helpTopics: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Learn the quickest way to find, check and save your first opportunity.",
    intro: "Flipbot is a deal-finding and valuation workspace for UK resellers. Start with Product Finder when you want Flipbot to look for opportunities, or use Scanner when you already have an item in front of you.",
    sections: [
      {
        title: "The Flipbot workflow",
        body: "Every feature supports the same practical loop: find an opportunity, analyse the numbers, decide whether it is worth investigating, save it and take action.",
        bullets: ["Find with Product Finder or Scanner.", "Analyse profit, ROI, demand and confidence.", "Decide using the evidence, not the score alone.", "Save useful research before the listing disappears."],
      },
      {
        title: "Before you buy",
        body: "Always confirm the exact model, variant, condition, accessories and live listing details yourself. Flipbot provides estimates and decision support; it cannot guarantee a resale price or profit.",
      },
    ],
  },
  {
    id: "product-finder",
    title: "Product Finder",
    summary: "Set up a category or product search across supported Facebook Marketplace and eBay listings.",
    intro: "Product Finder helps you narrow a marketplace into opportunities that match your buying budget and minimum estimated profit.",
    sections: [
      {
        title: "Search a category or a product",
        body: "Choose a category first. Leave ‘What are you looking for?’ blank to browse the whole category, or enter a product, brand or model such as iPhone, PS5 or MacBook Air to narrow it down.",
      },
      {
        title: "Choose your search area",
        body: "Facebook Marketplace searches use the location and radius you provide. eBay searches do not need a local radius. A wider radius can surface more listings, but may mean more travel.",
      },
      {
        title: "Credits and CEX",
        body: "A standard search uses 10 credits. Turning on the eligible CEX check adds 5 credits, so the total becomes 15 credits. The total is shown on the Find Deals button before you search.",
      },
      {
        title: "If no deals appear",
        body: "Try increasing your maximum buy price, lowering your minimum profit, widening the radius or broadening the product wording. A no-results search can also mean there are no suitable live opportunities at that moment.",
      },
    ],
  },
  {
    id: "scanner",
    title: "Scanner",
    summary: "Photograph an item while sourcing and check whether the asking price leaves resale potential.",
    intro: "Scanner is designed for shops, charity shops, car boots and other situations where the product is already in front of you.",
    sections: [
      {
        title: "Take a useful photo",
        body: "Show the full item, include logos or model markings and avoid glare or heavy shadows. Take another angle when an important label, port or accessory is not visible.",
        bullets: ["Keep faces, addresses and documents out of the image.", "Confirm the exact product before continuing.", "Enter the real asking price, including any known acquisition cost."],
      },
      {
        title: "Two different confidence measures",
        body: "Match Confidence describes how confident Flipbot is that the photographed item was identified correctly. Valuation Confidence describes how strongly available market evidence supports the resale estimate.",
      },
      {
        title: "Unclear or unsupported items",
        body: "If the product cannot be identified reliably, choose another suggested match or try a clearer image. Flipbot should not present a weak match as certain.",
      },
    ],
  },
  {
    id: "results",
    title: "Understanding results",
    summary: "Understand Flip Score, estimated profit, ROI, demand and valuation confidence.",
    intro: "Flipbot brings several signals together so you can compare opportunities quickly without hiding the numbers behind the recommendation.",
    sections: [
      { title: "Estimated resale and profit", body: "Estimated resale is the likely open-market value or range supported by available evidence. Estimated profit subtracts the asking price and known or estimated selling costs. It is not guaranteed net income and may not include every personal cost or tax obligation." },
      { title: "ROI", body: "ROI compares estimated profit with the purchase cost. A higher percentage can be useful, but it does not remove condition, demand, fraud or listing risks." },
      { title: "Flip Score", body: "Flip Score is out of 100: profit contributes up to 40 points, ROI 30, demand 15 and valuation confidence 15. Classifications are Exceptional Buy, Strong Buy, Possible Buy, Risky and Avoid. A high score is not a guarantee." },
      { title: "Demand and confidence", body: "Demand is shown as Low, Medium or High. Valuation Confidence is also Low, Medium or High and reflects the strength of product and market evidence behind the estimate." },
      { title: "CEX comparison", body: "For eligible products, Flipbot can show an indicative CEX instant-buy comparison. Eligibility, grading, acceptance and the final offer depend on the exact item and condition." },
    ],
  },
  {
    id: "saved-deals",
    title: "Saved Deals",
    summary: "Keep useful opportunities and their valuation research in one place.",
    intro: "Save a Product Finder or Scanner result when you want to review it later. Saving research does not reserve the external listing.",
    sections: [
      { title: "Listings can change", body: "External listings can be edited, sold, removed or become unavailable. When that happens, you can still review the saved valuation and search for similar opportunities." },
      { title: "Review before acting", body: "Market conditions and prices change. Recheck the original listing, product identity, condition and current evidence before buying." },
    ],
  },
  {
    id: "credits",
    title: "Credits and plans",
    summary: "See how searches and optional checks use your Flipbot allowance.",
    intro: "Credits are a usage allowance for eligible Flipbot tools. They are not cash, electronic money or a transferable balance.",
    sections: [
      { title: "Product Finder", body: "A standard Product Finder search uses 10 credits. An optional eligible CEX check adds 5 credits. Flipbot shows the total before the search begins." },
      { title: "Your allowance", body: "Your current balance and reset date appear in the dashboard. Final plan allowances, top-up rules and Scanner pricing must match the live billing configuration shown at checkout and in Plan & Billing." },
      { title: "Problems with a charge", body: "If an action fails or you believe credits were used incorrectly, contact support with the time, feature and a short description. Do not include passwords or full payment-card details." },
    ],
  },
  {
    id: "account",
    title: "Account, privacy and security",
    summary: "Manage preferences, connections, billing details and data choices.",
    intro: "Use Settings for sourcing and display preferences. Account & Usage shows your profile, plan, connections and current usage.",
    sections: [
      { title: "Connected services", body: "eBay and Discord connections use their own services and privacy practices. Facebook Marketplace is currently used as a Finder research source and is not presented as a connected account." },
      { title: "Keep your account secure", body: "Use a unique password, protect access to your email account and sign out on shared devices. Flipbot support will never ask for your password or full payment-card details." },
      { title: "Your data", body: "The Privacy Policy explains the account, search, Scanner, usage, connection and technical information Flipbot may need to process. Data rights and account-deletion requests will use the support route once the final contact address is connected." },
    ],
  },
];

export const faqItems = [
  ["What is Flipbot?", "Flipbot is a deal-finding and valuation platform for UK resellers. It helps you find opportunities, understand the numbers and make a more informed buy-or-pass decision."],
  ["Where does Flipbot find deals?", "Product Finder is designed around supported Facebook Marketplace and eBay listings."],
  ["Can I browse a whole category?", "Yes. Choose a category and leave the optional product field blank. Enter a product only when you want to narrow the category."],
  ["How much does a Product Finder search cost?", "A standard search uses 10 credits. Enabling the eligible CEX check adds 5, making the total 15 credits."],
  ["What does the CEX check do?", "It can add an indicative instant-buy comparison for eligible products. It does not guarantee eligibility, acceptance, grading or a final offer."],
  ["How does Flipbot estimate resale value?", "Flipbot uses available product and market evidence, including comparable sold-price information where available, to estimate a likely resale value or range."],
  ["What is estimated profit?", "It is estimated resale proceeds minus the purchase price and known or estimated selling costs. Your actual costs and result can differ."],
  ["What is ROI?", "ROI compares estimated profit with the purchase cost. It helps compare opportunities but does not remove resale risk."],
  ["What is Flip Score?", "Flip Score is a 100-point comparison: profit 40, ROI 30, demand 15 and valuation confidence 15."],
  ["Does a high Flip Score guarantee profit?", "No. Flip Score is decision support, not a guarantee of a sale, resale value or profit."],
  ["What is Valuation Confidence?", "It shows how strongly available product and market evidence supports Flipbot’s estimated resale value."],
  ["What is Scanner Match Confidence?", "It shows how confident Flipbot is that the photographed product was identified correctly. It is separate from Valuation Confidence."],
  ["What happens to Scanner photos?", "Scanner images are intended to be private and temporary. Avoid including people, addresses, documents or other unnecessary personal information."],
  ["Why has a listing disappeared?", "Marketplace listings are controlled by their sellers and platforms. They may be edited, sold or removed after Flipbot finds them."],
  ["Is Flipbot affiliated with Facebook, eBay, CEX or Discord?", "Flipbot uses or links to third-party services, but no endorsement or formal affiliation should be assumed unless explicitly stated."],
  ["Can Flipbot guarantee profit?", "No. Product condition, exact variant, fees, demand, timing and other factors can change the final result."],
] as const;

const sharedThirdPartyParagraph = "Flipbot may link to or interact with independent services including Facebook Marketplace, eBay, CEX, Discord and Stripe. Their own terms and privacy practices apply. References to these services do not imply endorsement, sponsorship or affiliation unless Flipbot states otherwise.";

export const policyDocuments: Record<PolicyId, PolicyDocument> = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    description: "How Flipbot may collect, use and protect information when you use the website and dashboard.",
    updated: "Draft for review — 21 August 2026",
    draftNote: "Before publication, the owner must add the legal business identity, addresses, final providers, retention periods and privacy contact details.",
    sections: [
      { title: "Who this policy applies to", paragraphs: ["This policy applies when you visit Flipbot, create an account, use Product Finder or Scanner, save a deal, manage a subscription, connect a supported account or contact support.", "The data controller is [OWNER TO CONFIRM: legal business name, trading address and country of establishment]. Privacy enquiries can be sent to [OWNER TO CONFIRM: privacy email address]."] },
      { title: "Information we may process", paragraphs: ["The information Flipbot needs depends on the features you use."], bullets: ["Account information such as your name, email address, account identifier, preferences and authentication records.", "Product Finder inputs such as search terms, category, source, budget, minimum profit, typed location or postcode, radius, history and interactions.", "Scanner information such as product photographs, asking price, identification choices, results and saved scan history.", "Saved Deals, notes where supported, feature usage, credit transactions and action timestamps.", "Subscription status, plan, billing customer identifiers and payment-status records. Full payment-card details are expected to be handled by Stripe rather than Flipbot.", "Connected-account identifiers and connection status for supported eBay and Discord workflows.", "Technical and security information such as IP address, browser/device details, session events, error logs and abuse-prevention events.", "Messages and attachments you send to support."] },
      { title: "How we use information", paragraphs: ["Flipbot may use information to provide and secure accounts; run searches and scans; calculate and present results; save user choices; manage credits and subscriptions; connect requested services; respond to support; prevent fraud and abuse; diagnose errors; improve the product; and comply with legal obligations.", "The lawful basis may be performance of a contract, legitimate interests, consent or legal obligation, depending on the activity. [OWNER TO CONFIRM: final lawful-basis mapping after the production data audit]."] },
      { title: "Location and Scanner images", paragraphs: ["Product Finder may process a location or postcode and radius that you enter. Flipbot should not describe this as precise live GPS collection unless that functionality is enabled.", "Scanner images are intended to be private and temporary. Do not deliberately include faces, identity documents, addresses, private correspondence or other information that is not needed to identify the product. [OWNER TO CONFIRM: image storage provider and deletion period]."] },
      { title: "Payments and connected services", paragraphs: ["Stripe is intended to process payments and subscription management. Flipbot may receive billing identifiers, plan and payment status, but should not receive or store full card details.", "If you connect eBay or Discord, Flipbot may process the account identifier, connection status and authorisation information needed to provide that connection. You can disconnect supported services from your account where the control is available.", sharedThirdPartyParagraph] },
      { title: "Cookies and analytics", paragraphs: ["Flipbot may use necessary storage for authentication, security and saved preferences such as display theme. Optional analytics or marketing technologies must not be described as active until verified in the Cookie Policy and, where required, offered through consent controls."] },
      { title: "Sharing, transfers and retention", paragraphs: ["Flipbot may share information with service providers that host, secure, analyse, communicate or process payments for the service, only as needed for their role. [OWNER TO CONFIRM: final processor list and international-transfer safeguards].", "Information should be kept only for as long as needed for the stated purpose, security, dispute handling and legal obligations. [OWNER TO CONFIRM: account, search, image, support, billing and security-log retention periods]."] },
      { title: "Security", paragraphs: ["Flipbot is designed to use access controls, protected credentials, user ownership checks and private handling for sensitive uploads. No online service can promise absolute security. Tell support promptly if you believe your account or information has been compromised."] },
      { title: "Your rights", paragraphs: ["Depending on UK data-protection law and your circumstances, you may have rights to access, correct, erase, restrict or object to processing, and to receive certain information in a portable format. You may also withdraw consent where processing relies on consent.", "Requests can be sent to [OWNER TO CONFIRM: privacy request address]. You may have the right to complain to the UK Information Commissioner’s Office at ico.org.uk."] },
      { title: "Children and changes", paragraphs: ["Flipbot is not intended for children below [OWNER TO CONFIRM: minimum user age].", "We may update this policy when the product, providers or law changes. Material changes should be communicated appropriately and the latest date shown on this page."] },
    ],
  },
  cookies: {
    id: "cookies",
    title: "Cookie Policy",
    description: "How Flipbot uses necessary browser storage and any optional measurement technologies.",
    updated: "Draft for review — 21 August 2026",
    draftNote: "A production cookie scan is required before this page is published.",
    sections: [
      { title: "What cookies are", paragraphs: ["Cookies and similar browser storage are small pieces of information used to remember a session, keep a service secure or retain a preference."] },
      { title: "Necessary storage", paragraphs: ["Flipbot may use necessary storage to keep you signed in, protect requests, remember security choices and provide features you ask for. These technologies are required for the service to work and are not used for unrelated advertising."] },
      { title: "Preferences", paragraphs: ["Preference storage may remember choices such as light or dark mode and selected dashboard settings, where those choices are persisted on the device or account."] },
      { title: "Analytics and marketing", paragraphs: ["[OWNER TO CONFIRM: analytics provider, cookies, purpose, duration and consent basis]. Optional analytics or marketing storage must remain disabled until the required consent is collected. If Flipbot does not use marketing cookies, say so plainly rather than showing an empty category."] },
      { title: "Your controls", paragraphs: ["Where optional cookies are used, you should be able to accept, reject or change those choices. You can also remove cookies through your browser, although removing necessary cookies may sign you out or reset preferences."] },
      { title: "Contact", paragraphs: ["Questions about cookies can be sent to [OWNER TO CONFIRM: privacy or support email]."] },
    ],
  },
  terms: {
    id: "terms",
    title: "Terms of Service",
    description: "The rules that apply when you create an account or use Flipbot.",
    updated: "Draft for review — 21 August 2026",
    draftNote: "These terms require legal review and confirmed business, consumer, billing and jurisdiction details before publication.",
    sections: [
      { title: "About these terms", paragraphs: ["These terms govern your use of Flipbot. The service is provided by [OWNER TO CONFIRM: legal business name and address]. By creating an account or using a paid feature, you agree to these terms and the policies linked from them.", "You must be at least [OWNER TO CONFIRM: minimum age] and legally able to enter into this agreement."] },
      { title: "What Flipbot provides", paragraphs: ["Flipbot provides product-discovery, valuation and reseller workflow tools. Features may include Product Finder, Scanner, Flip Score, Saved Deals, usage credits and supported third-party connections.", "Flipbot provides estimates and decision support. It does not guarantee that a listing is genuine or available, that an item will sell, that a resale value will be achieved or that you will make a profit. You are responsible for inspecting products, checking listings and deciding whether to buy or sell."] },
      { title: "Accounts", paragraphs: ["Provide accurate information, keep your sign-in details secure and tell us promptly about unauthorised use. You are responsible for activity on your account unless the law says otherwise. Do not share or resell access in a way that bypasses plan limits."] },
      { title: "Subscriptions and credits", paragraphs: ["Paid plans may renew automatically until cancelled. The price, billing period, included credits and key conditions must be shown before purchase.", "Credits are a service usage allowance, not cash or electronic money. Product Finder currently presents 10 credits for a standard search and 5 additional credits for an eligible CEX check. Other feature charges must match the live interface.", "[OWNER TO CONFIRM: renewals, credit resets, top-ups, failed-action refunds, plan changes, cancellation access and consumer cooling-off process]."] },
      { title: "External services and listings", paragraphs: [sharedThirdPartyParagraph, "External listings can be inaccurate, edited, sold or removed without notice. Flipbot does not control an external seller, marketplace, instant buyer or payment provider."] },
      { title: "Your content", paragraphs: ["You retain ownership of product photographs, notes and other content you submit. You give Flipbot the limited permission needed to host, analyse, display and process that content to provide and secure the service. You must have the right to submit it and must not upload unlawful or unnecessarily private material."] },
      { title: "Acceptable use", paragraphs: ["You must follow the Acceptable Use Policy. You must not interfere with the service, bypass credits or access controls, use unauthorised automation, scrape protected areas, introduce harmful code, misuse third-party services or use Flipbot for fraud or unlawful activity."] },
      { title: "Availability and changes", paragraphs: ["Flipbot may maintain, improve, replace or withdraw features. We do not promise uninterrupted availability, but paid users retain any mandatory legal remedies. Material changes to paid services or these terms should be communicated appropriately."] },
      { title: "Suspension and termination", paragraphs: ["Access may be restricted or suspended where reasonably necessary to protect users, providers or the service; investigate misuse; comply with law; or respond to non-payment. Where appropriate, we will explain the reason and offer a route to contact support."] },
      { title: "Liability and law", paragraphs: ["Nothing in these terms excludes liability that cannot lawfully be excluded, or removes mandatory consumer rights. [OWNER TO CONFIRM WITH LEGAL REVIEW: fair liability limits, governing law, jurisdiction, complaints and dispute process]."] },
      { title: "Contact", paragraphs: ["Questions about these terms can be sent to [OWNER TO CONFIRM: support and legal contact details]."] },
    ],
  },
  "acceptable-use": {
    id: "acceptable-use",
    title: "Acceptable Use Policy",
    description: "Straightforward rules that help keep Flipbot and its connected services safe and fair.",
    updated: "Draft for review — 21 August 2026",
    sections: [
      { title: "Use Flipbot lawfully", paragraphs: ["Use Flipbot only for lawful product research, valuation and reseller activities. Do not use it to facilitate fraud, theft, counterfeit sales, harassment, discrimination or infringement of another person’s rights."] },
      { title: "Protect accounts and limits", paragraphs: ["Do not share, sell or transfer account access in a way that avoids plan rules. Do not manipulate requests, replay actions or create accounts to bypass credits, trials, restrictions or security checks."] },
      { title: "No harmful automation or interference", paragraphs: ["Do not scrape protected parts of Flipbot, use unauthorised bots, overwhelm the service, probe for vulnerabilities without written permission, reverse engineer restricted systems, introduce malicious code or interfere with marketplaces and providers."] },
      { title: "Uploads and personal information", paragraphs: ["Only upload content you have the right to use. Keep faces, addresses, identity documents, private messages and other unnecessary personal information out of product photographs and notes."] },
      { title: "Enforcement", paragraphs: ["Flipbot may limit or suspend access while investigating suspected misuse. Serious or repeated breaches may lead to termination and, where appropriate, referral to providers or authorities. Contact [OWNER TO CONFIRM: support address] if you believe action was taken in error."] },
    ],
  },
  subscriptions: {
    id: "subscriptions",
    title: "Subscriptions, Credits and Cancellations",
    description: "A plain-English guide to plans, usage credits, renewals and managing your subscription.",
    updated: "Draft for review — 21 August 2026",
    draftNote: "Final allowances, renewal, cancellation, refund and cooling-off rules must be confirmed against Stripe and legal requirements.",
    sections: [
      { title: "Plans", paragraphs: ["The current working monthly prices are Starter £19.99, Plus £49.99 and Pro £79.99. The checkout page must show the final price, billing period, included credits and plan benefits before payment.", "[OWNER TO CONFIRM: final monthly credit allowances, saved-deal limits, priority benefits and annual pricing]."] },
      { title: "Credits", paragraphs: ["Credits are an allowance used by eligible Flipbot tools. They are not cash and cannot be withdrawn or used outside Flipbot.", "A standard Product Finder search uses 10 credits. Enabling an eligible CEX check adds 5 credits. Scanner and any future feature charges must be shown clearly before use."] },
      { title: "Renewals and plan changes", paragraphs: ["Subscriptions may renew automatically using the payment method held by Stripe until cancelled. [OWNER TO CONFIRM: renewal notices, immediate or scheduled upgrades and downgrades, and when new allowances apply]."] },
      { title: "Cancellation", paragraphs: ["You should be able to manage or cancel a subscription from Plan & Billing once the billing portal is connected. [OWNER TO CONFIRM: whether paid access continues to the end of the billing period, what happens to unused subscription and top-up credits, and the account-deletion relationship]."] },
      { title: "Refunds and consumer rights", paragraphs: ["Your statutory rights are not affected. [OWNER TO CONFIRM WITH LEGAL REVIEW: cooling-off process, request to begin digital service immediately, refund eligibility, failed-action credit restoration and exceptional refunds]."] },
      { title: "Billing support", paragraphs: ["For a billing problem, include the account email, date and a short description. Never send a password or full card number. Contact [OWNER TO CONFIRM: billing support link or email]."] },
    ],
  },
};

export const policyOrder: PolicyId[] = ["privacy", "cookies", "terms", "acceptable-use", "subscriptions"];

