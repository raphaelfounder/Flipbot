# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Flipbot serves both beginner and experienced resellers. It should reveal only what is necessary by default while allowing experienced users to access more specific search controls and valuation detail. Desktop is the expected primary environment, but the complete product must also work well on mobile.

## Product Purpose

Flipbot helps resellers find underpriced products, assess resale potential, save promising opportunities, and make faster buying decisions. The primary user outcome is finding a worthwhile deal with enough evidence to understand its likely profit and risk.

## Positioning

Flipbot combines category-led marketplace discovery with product-specific resale evidence. Users can browse from broad categories down to exact variants, such as Technology → Phones → Apple → iPhone → iPhone 15 Pro Max → 128GB, while still being allowed to search at any broader level.

## Operating Context

The core workflow begins on Find a Deal. Users select a product or category, location, radius, and budget; review results; inspect a deal in a quick side panel; optionally open its full detail page; and save worthwhile listings. Scanner is a parallel entry point that identifies an item and opens the same valuation experience. Saved Deals holds listings the user intentionally keeps for later review.

## Capabilities and Constraints

- The current project phase is UI/UX only. It must design and prototype the complete finished experience without implementing or changing the live search system, provider integrations, billing logic, or production software behavior.
- Flipbot now uses its own provider access for Facebook Marketplace and pricing information. The cofounder is building the search system separately; the interface should expose clear future integration boundaries and must not assume the old provider implementation remains valid.
- Find a Deal is the default and primary dashboard surface.
- Search supports both a hierarchical product/category selector and direct text search at any level of the hierarchy.
- Result cards show an image, title, asking price, location and distance, estimated resale value, estimated profit, ROI, Flip Score, confidence or risk, and listing age.
- Deal details include valuation reasoning, comparable sold evidence, risks, and the source listing link.
- CeX and other instant-buyer prices are optional paid information inside the deal experience, not standalone navigation sections.
- Unlocking instant-buyer information displays its credit cost, requires explicit confirmation, charges only after confirmation, and remains available permanently for that saved deal.
- Scanner is a main navigation destination beside Find a Deal and Saved Deals.
- Credits and usage remain visible in the top-right account area.
- Membership information and buying additional credits must be easy to find from the account area.
- Profile, membership, settings, help, and sign out live in the profile menu rather than permanent primary navigation.
- Auto Lister, Analytics, and Marketplace Connections are excluded from the initial finished dashboard.
- Subscription prices and exact credit costs remain undecided.
- UI states should use realistic representative data and clearly defined loading, empty, locked, success, and error behavior, while remaining backend-agnostic.

## Brand Commitments

The product name is Flipbot. Interface language should be direct, concise, and understandable to beginners without slowing down experienced resellers.

## Evidence on Hand

The existing repository contains a working dashboard implementation, authentication and profile flows, category and canonical-product data, Facebook Marketplace observations, CeX observations, sold-comparison data, and the current Flipbot visual identity. No customer testimonials or validated public performance claims have been confirmed and future work must not fabricate them.

## Product Principles

- Lead every session toward finding a deal.
- Keep the default experience focused and progressively reveal complexity.
- Treat valuation evidence and uncertainty honestly rather than presenting estimates as guarantees.
- Reuse one consistent deal-evaluation experience across search, scanner, and saved deals.
- Make paid credit actions explicit, confirmed, and durable after purchase.

## Accessibility & Inclusion

The dashboard must be keyboard accessible, responsive from desktop to mobile, usable with reduced motion, and understandable without relying on colour alone.
