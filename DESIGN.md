---
name: Flipbot
description: A restrained dark-navy operating system for evidence-led resale decisions.
colors:
  action-blue: "#246bfd"
  action-blue-bright: "#4c8dff"
  action-blue-soft: "#174fc1"
  action-blue-deep: "#071a44"
  canvas-ink: "#020308"
  canvas-soft: "#05070d"
  surface-navy: "#070a11"
  surface-hover: "#0a0f1b"
  text-primary: "#f7f9ff"
  text-secondary: "#a4adbd"
  text-muted: "#687386"
  border-cool: "rgba(120, 155, 255, 0.12)"
  profit-positive: "#6ee7b7"
  warning-caution: "#fcd34d"
  danger-critical: "#fecaca"
typography:
  display:
    fontFamily: "Source Sans 3, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Source Sans 3, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Source Sans 3, Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Source Sans 3, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  compact: "0.5rem"
  control: "0.75rem"
  card: "1rem"
  dialog: "1.5rem"
  empty-state: "1.625rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  2xl: "1.5rem"
  3xl: "1.75rem"
  4xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-bright}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
    height: "2.75rem"
  input-default:
    backgroundColor: "rgba(255, 255, 255, 0.035)"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 0.75rem"
    height: "2.75rem"
  card-deal:
    backgroundColor: "#060911"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "1rem"
---

# Design System: Flipbot

## Overview

**Creative North Star: "The Resale Intelligence Desk"**

Flipbot behaves like a focused operating desk for resale decisions: dark, calm and information-dense, with enough visual structure to compare opportunities quickly. Near-black navy layers reduce glare and make product imagery, prices and evidence carry the screen. Electric blue is deliberately scarce; it identifies active navigation, primary actions and interactive evidence rather than decorating empty space.

The system is desktop-first without treating mobile as a reduced product. Desktop uses a persistent rail and broad comparison canvas; mobile converts the same three primary destinations into a reachable bottom bar and stacks evidence without removing it. Representative or provisional information is labelled in context, and valuation confidence is communicated with words and evidence rather than colour alone.

**Key Characteristics:**

- Near-black navy surfaces separated by cool, low-contrast borders.
- Restrained electric-blue accents reserved for action and selection.
- Compact, evidence-heavy deal cards with product imagery and tabular figures.
- Progressive disclosure for advanced filters, account tools and deal detail.
- Responsive navigation that preserves Find a Deal, Scanner and Saved Deals as peers.

## Colors

The palette is a cool, low-luminance field with a single blue action voice and small semantic signals for profit, caution and destructive states.

### Primary

- **Signal Blue** (`action-blue`): Primary buttons, selected navigation and decisive interactive states.
- **Active Signal** (`action-blue-bright`): Hover emphasis for the primary action channel.
- **Deep Signal** (`action-blue-soft`, `action-blue-deep`): Restrained blue layering, focus context and blue-tinted surfaces.

### Neutral

- **Canvas Ink** (`canvas-ink`): The application ground and fixed header base.
- **Soft Canvas** (`canvas-soft`): Side sheets and close secondary planes.
- **Surface Navy** (`surface-navy`): Reusable cards, menus and mobile navigation.
- **Hover Navy** (`surface-hover`): Subtle interactive surface lift.
- **Paper White** (`text-primary`): Primary headings, values and control text.
- **Steel Copy** (`text-secondary`): Supporting copy that must remain readily legible.
- **Muted Slate** (`text-muted`): Metadata, labels and low-priority guidance.
- **Cool Hairline** (`border-cool`): Quiet structural separation on dark surfaces.

### Tertiary

- **Profit Mint** (`profit-positive`): Positive profit and ROI figures.
- **Caution Amber** (`warning-caution`): Risk and recoverable warning states.
- **Critical Rose** (`danger-critical`): Destructive actions and critical language.

### Named Rules

**The One Signal Rule.** Blue is the shared language of primary action, selection and active navigation; keep it rare enough that those states remain unmistakable.

**The Evidence Before Colour Rule.** Semantic colour reinforces a written value or state and never carries meaning alone.

## Typography

**Display Font:** Source Sans 3 (with Arial, Helvetica and sans-serif fallbacks)
**Body Font:** Source Sans 3 (with Arial, Helvetica and sans-serif fallbacks)

**Character:** The single-family system is direct, compact and neutral enough for repeated numerical comparison. Hierarchy comes from weight, size, spacing and alignment rather than mixing expressive faces.

### Hierarchy

- **Display** (semibold, responsive `display`, tight leading): Primary task introductions such as Find a Deal and Scanner.
- **Headline** (semibold, responsive `headline`, tight tracking): Account pages and substantial surface titles.
- **Title** (semibold, `title`): Deal names, section titles and dialog headings.
- **Body** (regular, `body`): Explanations, evidence and field values; explanatory paragraphs use relaxed line-height and generally stay within a readable two-column measure.
- **Label** (medium, `label`): Field labels and metadata. Dense numerical labels may step down to 11px or 10px while their associated value remains larger.

### Named Rules

**The Comparison First Rule.** Prices, profit, ROI and credit balances use tabular numerals so columns do not shift while values change.

**The Quiet Metadata Rule.** Small type is reserved for short labels and metadata; explanations remain at body size with generous leading.

## Layout

The desktop shell uses a fixed 232px navigation rail, a fixed 72px top bar and a fluid content canvas capped at 1480px. Content gutters begin at 16px, increase to 24px on small screens and reach 32px on large screens. The default vertical rhythm is 28px between major dashboard passages, with 16–20px gaps inside operational groups and 8–12px gaps inside controls or metric clusters.

At the medium breakpoint (768px), the side rail appears and the mobile navigation is removed. At the small breakpoint (640px), cards may move from stacked image-over-content to horizontal image-and-evidence layouts. At the extra-large breakpoint (1280px), search controls form a task-specific multi-column row and deal results become two columns. Mobile retains the full workflow, adds bottom clearance for the fixed navigation and stacks form controls and card evidence in reading order.

**The Preserve the Evidence Rule.** Responsive layouts reflow controls and comparisons; they do not hide valuation evidence or demote a primary destination.

## Elevation & Depth

The system is flat by default and establishes depth through tonal layering, cool hairline borders and occasional directional shadows. Shadows are reserved for floating or modal elements that overlap the workspace: menus, bottom navigation, toast messages, dialogs and the deal inspection sheet.

### Shadow Vocabulary

- **Surface Ambient** (`0 24px 70px rgb(0 0 0 / 0.2)`): Large reusable surfaces when separation from the canvas needs reinforcement.
- **Floating Control** (`0 18px 50px rgba(0, 0, 0, 0.5)`): Mobile navigation and transient notices.
- **Overlay Deep** (`0 24px 80px rgba(0, 0, 0, 0.6)`): Confirmation and onboarding dialogs.
- **Sheet Directional** (`-24px 0 70px rgba(0, 0, 0, 0.45)`): The right-edge deal inspection panel.

**The Flat Until Floating Rule.** In-flow cards use border and tone at rest; strong shadows belong only to elements that genuinely float above or slide over the workspace.

## Shapes

Controls use gently rounded 12px corners, cards and mobile navigation use 16px corners, and dialogs use 24px corners. Large reusable surfaces and empty states may use the established 26px corner. Compact badges use 8px corners, while progress indicators and status tracks may be fully pill-shaped. Borders remain one pixel and low contrast; geometry is soft but never bubbly.

**The Nested Radius Rule.** Inner controls use a tighter radius than their parent surface, preserving a clear container hierarchy.

## Components

### Buttons

- **Shape:** Compact, confident controls with a 12px radius and a 44px minimum target; major search and upload actions increase to 48px.
- **Primary:** Signal Blue fill, Paper White text, semibold body typography and balanced horizontal padding.
- **Hover / Focus:** Primary fill brightens; keyboard focus uses a visible blue outline or halo with a four-pixel visual offset.
- **Secondary:** Transparent at rest with a cool low-contrast border, becoming slightly lighter on hover.
- **Danger:** A restrained translucent red surface and border with explicit destructive copy.

### Chips

- **Style:** Low-contrast translucent surface, hairline border, compact padding and regular-weight secondary text.
- **State:** Selected or account-status chips adopt blue-tinted text and surface without competing with the primary button.

### Cards / Containers

- **Corner Style:** 16px for deal cards; 26px for the larger reusable `surface` container.
- **Background:** Deal cards use a slightly denser navy than the canvas; internal metrics use near-transparent white layering.
- **Shadow Strategy:** In-flow cards stay flat; see the Flat Until Floating Rule.
- **Border:** One-pixel cool-white or blue-tinted hairline, strengthened subtly on hover.
- **Internal Padding:** 16px by default, rising to 20–28px for large account and scanner surfaces.

### Inputs / Fields

- **Style:** 44px minimum height, 12px radius, translucent light-on-dark fill, hairline border and 12px horizontal padding.
- **Focus:** Border shifts toward light blue and receives a restrained two-pixel blue halo.
- **Error / Disabled:** Disabled controls reduce opacity while retaining their shape and label; validation messages use explicit language rather than colour alone.

### Navigation

- **Desktop:** A 232px fixed rail with 48px-high destinations. The active destination receives a blue-tinted surface, blue text and a quiet one-pixel ring.
- **Mobile:** The same three destinations occupy a fixed three-column bottom bar; the active state uses the same blue language and includes both icon and text.
- **Account:** Credits and plan status stay in the top-right account area; profile, membership, settings and help live in the profile menu rather than the primary rail.

### Deal Card

The signature deal card pairs real product imagery with title, source and age, location and risk, four aligned financial metrics, Flip Score, demand and an Inspect action. On narrow screens the image stacks above the evidence; from the small breakpoint it becomes a fixed-width left rail. The card may compact its internal padding, but the evidence set stays intact.

### Deal Inspection Sheet

Deal inspection is a full-height right-edge sheet on larger screens and fills the width on mobile. It reuses the same product identity and financial metrics, then expands into valuation reasoning, comparisons, risk and optional buyer-price information. Save and source-listing actions remain anchored together at the bottom.

## Do's and Don'ts

### Do:

- **Do** lead operational surfaces toward one clear next action, using Signal Blue for that action.
- **Do** keep representative, estimated, locked or prototype information labelled beside the affected content.
- **Do** use tabular numerals and stable metric order for price, resale, profit and ROI comparisons.
- **Do** preserve keyboard focus, reduced-motion behavior and text labels alongside icons.
- **Do** keep Find a Deal, Scanner and Saved Deals as the primary navigation set across viewport sizes.

### Don't:

- **Don't** use blue as ambient decoration across every card; its scarcity establishes hierarchy.
- **Don't** replace evidence with a score, colour or optimistic claim.
- **Don't** add permanent primary-navigation destinations for account utilities or future product areas.
- **Don't** hide financial or risk evidence merely to make mobile cards shorter.
- **Don't** introduce bright white panels, glass-heavy effects or warm decorative palettes into the operating workspace.
